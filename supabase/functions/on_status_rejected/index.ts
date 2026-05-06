import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const FROM = "Essist Capital <no-reply@essistcapital.com>";

serve(async (req) => {
  try {
    const { applicationId, reason } = await req.json();
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: app } = await supabase.from("applications").select("*, profiles(first_name, email)").eq("id", applicationId).single();
    if (!app) return new Response("Not found", { status: 404 });

    const name = app.profiles?.first_name || "Applicant";
    const email = app.profiles?.email;
    const adminNotes = reason || app.admin_notes || "Please contact us for more information.";

    const html = `<!DOCTYPE html><html><body style="font-family:Arial;background:#f5f5f0;"><div style="max-width:600px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;">
      <div style="background:#0a1628;padding:32px 40px;text-align:center;"><span style="font-size:22px;font-weight:bold;color:#fff;">Essist <span style="color:#c9a84c;">Capital</span></span></div>
      <div style="padding:40px;">
        <h1 style="font-size:24px;margin:0 0 16px;">Application Update</h1>
        <p>Hi ${name},</p>
        <p>Thank you for applying with Essist Capital. After reviewing your application, we are unable to approve your loan request at this time.</p>
        <p><strong>Reason:</strong> ${adminNotes}</p>
        <p>You are welcome to reapply in the future if your circumstances change. If you have questions about this decision, please contact us at hello@essistcapital.com.</p>
      </div>
      <div style="background:#f5f5f0;padding:24px;text-align:center;font-size:12px;color:#888;">Essist Capital LLC · NJ &amp; NY</div>
    </div></body></html>`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM, to: email, subject: "Update on Your Essist Capital Application", html }),
    });

    if (!res.ok) throw new Error(await res.text());
    return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
