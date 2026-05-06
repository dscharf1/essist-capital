import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const FROM = "Essist Capital <no-reply@essistcapital.com>";

const emailTemplate = (title: string, body: string) => `
<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
body{font-family:Arial,sans-serif;background:#f5f5f0;margin:0;padding:0;}
.wrapper{max-width:600px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;}
.header{background:#0a1628;padding:32px 40px;text-align:center;}
.logo{font-size:22px;font-weight:bold;color:#fff;}
.logo span{color:#c9a84c;}
.body{padding:40px;color:#1a2535;}
h1{font-size:24px;font-weight:bold;margin:0 0 16px;}
p{font-size:15px;line-height:1.6;color:#4a5568;margin:0 0 12px;}
.cta{display:inline-block;background:#c9a84c;color:#0a1628;font-weight:bold;padding:14px 28px;border-radius:10px;text-decoration:none;margin:20px 0;}
.footer{background:#f5f5f0;padding:24px 40px;text-align:center;font-size:12px;color:#888;}
</style></head>
<body><div class="wrapper">
  <div class="header"><div class="logo">Essist<span> Capital</span></div></div>
  <div class="body"><h1>${title}</h1>${body}</div>
  <div class="footer"><p>Essist Capital LLC · NJ &amp; NY · hello@essistcapital.com</p></div>
</div></body></html>`;

serve(async (req) => {
  try {
    const { applicationId } = await req.json();
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: app } = await supabase.from("applications").select("*, profiles(first_name, email)").eq("id", applicationId).single();
    if (!app) return new Response("Not found", { status: 404 });

    const name = app.profiles?.first_name || "Applicant";
    const email = app.profiles?.email;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: FROM,
        to: email,
        subject: "Congratulations — Your Essist Capital Loan Is Approved!",
        html: emailTemplate("Your Application Has Been Approved!", `
          <p>Hi ${name},</p>
          <p>We have great news — your Essist Capital loan application has been <strong>approved</strong>!</p>
          <p>A member of our team will be following up with a separate email containing all of your loan details, next steps, and funding instructions.</p>
          <p>In the meantime, you can log in to your dashboard to check your application status.</p>
          <a class="cta" href="https://essistcapital.com/dashboard">View My Dashboard</a>
          <p>If you have any immediate questions, feel free to reach out to us directly at <a href="mailto:dscharf@essistcap.com" style="color:#c9a84c;">dscharf@essistcap.com</a>.</p>
          <p>Thank you for choosing Essist Capital.</p>
        `),
      }),
    });

    if (!res.ok) throw new Error(await res.text());
    return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
