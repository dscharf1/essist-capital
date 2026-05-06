import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const FROM = "Essist Capital <no-reply@essistcapital.com>";

serve(async (req) => {
  try {
    const { applicationId } = await req.json();
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: app } = await supabase.from("applications").select("*, profiles(first_name, email)").eq("id", applicationId).single();
    const { data: card } = await supabase.from("virtual_cards").select("*").eq("application_id", applicationId).single();
    if (!app || !card) return new Response("Not found", { status: 404 });

    const name = app.profiles?.first_name || "Borrower";
    const email = app.profiles?.email;

    const html = `<!DOCTYPE html><html><body style="font-family:Arial;background:#f5f5f0;"><div style="max-width:600px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;">
      <div style="background:#0a1628;padding:32px 40px;text-align:center;"><span style="font-size:22px;font-weight:bold;color:#fff;">Essist <span style="color:#c9a84c;">Capital</span></span></div>
      <div style="padding:40px;">
        <h1 style="font-size:24px;margin:0 0 16px;">Your Virtual Card Is Ready!</h1>
        <p>Hi ${name},</p>
        <p>Your Essist Capital virtual card has been issued and is ready to use for your home improvement project.</p>
        <ul style="padding-left:20px;color:#4a5568;">
          <li>Card ending in: <strong>${card.card_last_four}</strong></li>
          <li>Credit limit: <strong>$${Number(card.credit_limit).toLocaleString()}</strong></li>
          <li>Available balance: <strong>$${Number(card.available_balance).toLocaleString()}</strong></li>
        </ul>
        <p>Log in to your dashboard to view your full card details and transaction history.</p>
        <a href="https://essistcapital.com/dashboard" style="display:inline-block;background:#c9a84c;color:#0a1628;font-weight:bold;padding:14px 28px;border-radius:10px;text-decoration:none;margin:20px 0;">View Dashboard</a>
        <p style="font-size:13px;color:#888;">Do not share your card details with anyone. Contact us immediately if you notice any unauthorized transactions.</p>
      </div>
      <div style="background:#f5f5f0;padding:24px;text-align:center;font-size:12px;color:#888;">Essist Capital LLC · NJ &amp; NY</div>
    </div></body></html>`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM, to: email, subject: "Your Essist Capital Virtual Card Is Ready", html }),
    });

    if (!res.ok) throw new Error(await res.text());
    return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
