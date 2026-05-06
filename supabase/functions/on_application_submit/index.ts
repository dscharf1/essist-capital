import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const ADMIN_EMAIL = Deno.env.get("ADMIN_EMAIL") || "admin@essistcapital.com";
const FROM = "Essist Capital <no-reply@essistcapital.com>";

const emailTemplate = (title: string, body: string) => `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><style>
  body { font-family: 'Plus Jakarta Sans', Arial, sans-serif; background: #f5f5f0; margin: 0; padding: 0; }
  .wrapper { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; }
  .header { background: #0a1628; padding: 32px 40px; text-align: center; }
  .logo { font-size: 22px; font-weight: bold; color: #fff; letter-spacing: -0.5px; }
  .logo span { color: #c9a84c; }
  .body { padding: 40px; color: #1a2535; }
  h1 { font-size: 24px; font-weight: bold; margin: 0 0 16px; }
  p { font-size: 15px; line-height: 1.6; color: #4a5568; margin: 0 0 12px; }
  .cta { display: inline-block; background: #c9a84c; color: #0a1628; font-weight: bold; padding: 14px 28px; border-radius: 10px; text-decoration: none; margin: 20px 0; }
  .footer { background: #f5f5f0; padding: 24px 40px; text-align: center; font-size: 12px; color: #888; }
</style></head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="logo">Essist<span> Capital</span></div>
    </div>
    <div class="body">
      <h1>${title}</h1>
      ${body}
    </div>
    <div class="footer">
      <p>Essist Capital LLC · Serving NJ &amp; NY · hello@essistcapital.com</p>
      <p>Rate shown is a flat add-on rate, not APR. Loans subject to credit approval.</p>
    </div>
  </div>
</body>
</html>`;

async function sendEmail(to: string, subject: string, html: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM, to, subject, html }),
  });
  if (!res.ok) throw new Error(await res.text());
}

serve(async (req) => {
  try {
    const { applicationId } = await req.json();
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: app } = await supabase.from("applications").select("*, profiles(first_name, last_name, email)").eq("id", applicationId).single();
    if (!app) return new Response("Application not found", { status: 404 });

    const applicantEmail = app.profiles?.email || app.property_address;
    const applicantName = `${app.profiles?.first_name || ""} ${app.profiles?.last_name || ""}`.trim() || "Applicant";

    // Email to applicant
    await sendEmail(
      applicantEmail,
      "Your Essist Capital Application Has Been Received",
      emailTemplate(
        "Application Received!",
        `<p>Hi ${applicantName},</p>
        <p>Thank you for applying with Essist Capital. We have received your application for a <strong>$${Number(app.loan_amount).toLocaleString()}</strong> home improvement loan.</p>
        <p>Our team will review your application and be in touch within 1–2 business days. In the meantime, you can log in to your dashboard to track the status and upload any required documents.</p>
        <a class="cta" href="https://essistcapital.com/dashboard">View Dashboard</a>
        <p>If you have any questions, reply to this email or contact us at hello@essistcapital.com.</p>`
      )
    );

    // Alert to admin
    await sendEmail(
      ADMIN_EMAIL,
      `New Application — ${applicantName} — $${Number(app.loan_amount).toLocaleString()}`,
      emailTemplate(
        "New Loan Application",
        `<p>A new application has been submitted:</p>
        <ul style="padding-left:20px;color:#4a5568">
          <li><strong>Applicant:</strong> ${applicantName}</li>
          <li><strong>Loan Amount:</strong> $${Number(app.loan_amount).toLocaleString()}</li>
          <li><strong>Term:</strong> ${app.term_months} months</li>
          <li><strong>Project Type:</strong> ${app.project_type}</li>
          <li><strong>Property:</strong> ${app.property_city}, ${app.property_state}</li>
        </ul>
        <a class="cta" href="https://essistcapital.com/admin/approvals">Review Application</a>`
      )
    );

    return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
