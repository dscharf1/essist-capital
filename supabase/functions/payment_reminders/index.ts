/**
 * Payment Reminder Edge Function
 * Called by scheduled cron jobs to send reminders based on due date proximity.
 *
 * Expected body: { type: "7day" | "3day" | "24hr" | "due_today" | "missed" | "monthly_statement" }
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const FROM = "Essist Capital <no-reply@essistcapital.com>";

async function sendEmail(to: string, subject: string, html: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM, to, subject, html }),
  });
  if (!res.ok) console.error("Resend error:", await res.text());
}

const wrap = (body: string) => `<!DOCTYPE html><html><body style="font-family:Arial;background:#f5f5f0;"><div style="max-width:600px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;">
  <div style="background:#0a1628;padding:28px 40px;text-align:center;"><span style="font-size:20px;font-weight:bold;color:#fff;">Essist <span style="color:#c9a84c;">Capital</span></span></div>
  <div style="padding:36px;">${body}</div>
  <div style="background:#f5f5f0;padding:20px;text-align:center;font-size:12px;color:#888;">Essist Capital LLC · NJ &amp; NY · hello@essistcapital.com</div>
</div></body></html>`;

serve(async (req) => {
  const { type } = await req.json();
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dayOffsets: Record<string, number> = { "7day": 7, "3day": 3, "24hr": 1, "due_today": 0 };
  const sent: string[] = [];

  if (type === "monthly_statement") {
    // Send statement to all active borrowers
    const { data: apps } = await supabase
      .from("applications")
      .select("*, profiles(first_name, email)")
      .in("status", ["funded", "active"]);

    for (const app of apps || []) {
      const email = app.profiles?.email;
      const name = app.profiles?.first_name || "Borrower";
      if (!email) continue;

      const { data: payments } = await supabase
        .from("payments")
        .select("*")
        .eq("application_id", app.id)
        .order("payment_number");

      const paid = payments?.filter(p => p.status === "paid") || [];
      const upcoming = payments?.find(p => p.status === "scheduled");
      const totalPaid = paid.reduce((s, p) => s + Number(p.amount_paid || p.amount_due), 0);
      const remaining = Number(app.total_repayment) - totalPaid;

      await sendEmail(email, "Your Monthly Essist Capital Statement", wrap(`
        <h2 style="margin:0 0 16px;font-size:22px;">Monthly Statement</h2>
        <p>Hi ${name},</p>
        <p>Here is your monthly loan summary:</p>
        <ul style="padding-left:20px;color:#4a5568;">
          <li>Total paid to date: <strong>$${totalPaid.toFixed(2)}</strong></li>
          <li>Remaining balance: <strong>$${remaining.toFixed(2)}</strong></li>
          ${upcoming ? `<li>Next payment due: <strong>${new Date(upcoming.due_date).toLocaleDateString('en-US', {month:'long',day:'numeric',year:'numeric'})} — $${Number(upcoming.amount_due).toFixed(2)}</strong></li>` : ""}
        </ul>
        <a href="https://essistcapital.com/dashboard" style="display:inline-block;background:#c9a84c;color:#0a1628;font-weight:bold;padding:12px 24px;border-radius:8px;text-decoration:none;margin-top:16px;">View Dashboard</a>
      `));
      sent.push(email);
    }
  } else if (type === "missed") {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const { data: payments } = await supabase
      .from("payments")
      .select("*, applications(user_id, loan_amount, profiles(first_name, email))")
      .eq("status", "scheduled")
      .lte("due_date", yesterday.toISOString().split("T")[0]);

    for (const payment of payments || []) {
      const app = payment.applications as Record<string, unknown>;
      const profile = (app?.profiles || {}) as Record<string, unknown>;
      const email = profile.email as string;
      const name = (profile.first_name as string) || "Borrower";
      if (!email) continue;

      await supabase.from("payments").update({ status: "missed" }).eq("id", payment.id);
      await sendEmail(email, `Action Required — Missed Payment — Essist Capital`, wrap(`
        <h2 style="margin:0 0 16px;font-size:22px;color:#dc2626;">Missed Payment Notice</h2>
        <p>Hi ${name},</p>
        <p>We were unable to process your payment of <strong>$${Number(payment.amount_due).toFixed(2)}</strong> that was due on ${new Date(payment.due_date).toLocaleDateString('en-US', {month:'long',day:'numeric',year:'numeric'})}.</p>
        <p>Please log in to your dashboard and contact us immediately to bring your account current and avoid additional late fees.</p>
        <a href="https://essistcapital.com/dashboard" style="display:inline-block;background:#c9a84c;color:#0a1628;font-weight:bold;padding:12px 24px;border-radius:8px;text-decoration:none;margin-top:16px;">Resolve Now</a>
      `));
      sent.push(email);
    }
  } else {
    const offset = dayOffsets[type];
    if (offset === undefined) return new Response("Unknown type", { status: 400 });

    const targetDate = new Date(today);
    targetDate.setDate(targetDate.getDate() + offset);
    const targetStr = targetDate.toISOString().split("T")[0];

    const { data: payments } = await supabase
      .from("payments")
      .select("*, applications(user_id, loan_amount, profiles(first_name, email))")
      .eq("status", "scheduled")
      .eq("due_date", targetStr);

    const subjectMap: Record<string, (amt: string) => string> = {
      "7day": (amt) => `Your payment of $${amt} is due in 7 days — Essist Capital`,
      "3day": (amt) => `Your payment of $${amt} is due in 3 days — Essist Capital`,
      "24hr": (amt) => `Your payment of $${amt} is due tomorrow — Essist Capital`,
      "due_today": (amt) => `Your payment of $${amt} is due today — Essist Capital`,
    };

    for (const payment of payments || []) {
      const app = payment.applications as Record<string, unknown>;
      const profile = (app?.profiles || {}) as Record<string, unknown>;
      const email = profile.email as string;
      const name = (profile.first_name as string) || "Borrower";
      if (!email) continue;

      const amt = Number(payment.amount_due).toFixed(2);
      const dueDate = new Date(payment.due_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

      await sendEmail(email, subjectMap[type](amt), wrap(`
        <h2 style="margin:0 0 16px;font-size:22px;">Payment Reminder</h2>
        <p>Hi ${name},</p>
        <p>This is a reminder that your Essist Capital loan payment of <strong>$${amt}</strong> is due on <strong>${dueDate}</strong>.</p>
        <p>Please ensure your payment method is up to date. If you have any questions, contact us at hello@essistcapital.com.</p>
        <a href="https://essistcapital.com/dashboard" style="display:inline-block;background:#c9a84c;color:#0a1628;font-weight:bold;padding:12px 24px;border-radius:8px;text-decoration:none;margin-top:16px;">View Dashboard</a>
      `));
      sent.push(email);
    }
  }

  return new Response(JSON.stringify({ success: true, sent: sent.length }), { headers: { "Content-Type": "application/json" } });
});
