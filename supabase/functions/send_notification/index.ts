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
h1{font-size:22px;font-weight:bold;margin:0 0 16px;}
p{font-size:15px;line-height:1.6;color:#4a5568;margin:0 0 12px;}
.cta{display:inline-block;background:#c9a84c;color:#0a1628;font-weight:bold;padding:14px 28px;border-radius:10px;text-decoration:none;margin:20px 0;}
.footer{background:#f5f5f0;padding:24px 40px;text-align:center;font-size:12px;color:#888;}
</style></head>
<body><div class="wrapper">
  <div class="header"><div class="logo">Essist<span> Capital</span></div></div>
  <div class="body"><h1>${title}</h1>${body}</div>
  <div class="footer"><p>Essist Capital LLC · NJ &amp; NY · <a href="mailto:dscharf@essistcap.com" style="color:#c9a84c;">dscharf@essistcap.com</a></p></div>
</div></body></html>`;

serve(async (req) => {
  try {
    const { userId, title, message } = await req.json();
    if (!userId || !title || !message) {
      return new Response(JSON.stringify({ error: "Missing userId, title, or message" }), { status: 400 });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: profile } = await supabase
      .from("profiles")
      .select("first_name, last_name, email")
      .eq("user_id", userId)
      .single();

    if (!profile?.email) {
      return new Response(JSON.stringify({ error: "No email found for user" }), { status: 404 });
    }

    const name = profile.first_name || "Borrower";

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: profile.email,
        subject: `${title} — Essist Capital`,
        html: emailTemplate(title, `
          <p>Hi ${name},</p>
          <p>${message.replace(/\n/g, "</p><p>")}</p>
          <a class="cta" href="https://essistcapital.com/dashboard">View My Dashboard</a>
          <p>Questions? Reply to this email or reach us at <a href="mailto:dscharf@essistcap.com" style="color:#c9a84c;">dscharf@essistcap.com</a>.</p>
        `),
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Resend error: ${errText}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send_notification error:", err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
