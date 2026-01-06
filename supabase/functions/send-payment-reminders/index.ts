import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("Resend API key not configured");
    }

    const resend = new Resend(resendApiKey);
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const today = new Date();
    const in7Days = new Date(today);
    in7Days.setDate(in7Days.getDate() + 7);
    const in3Days = new Date(today);
    in3Days.setDate(in3Days.getDate() + 3);

    const sevenDayDate = in7Days.toISOString().split('T')[0];
    const threeDayDate = in3Days.toISOString().split('T')[0];

    console.log(`Checking for reminders: 7-day=${sevenDayDate}, 3-day=${threeDayDate}`);

    // Get schedules needing 7-day reminder
    const { data: sevenDaySchedules, error: sevenError } = await supabase
      .from("repayment_schedules")
      .select(`
        *,
        loan_applications:application_id (
          first_name,
          last_name,
          email
        )
      `)
      .eq("status", "active")
      .eq("reminder_7_day_sent", false)
      .eq("next_payment_date", sevenDayDate);

    if (sevenError) throw sevenError;

    // Get schedules needing 3-day reminder
    const { data: threeDaySchedules, error: threeError } = await supabase
      .from("repayment_schedules")
      .select(`
        *,
        loan_applications:application_id (
          first_name,
          last_name,
          email
        )
      `)
      .eq("status", "active")
      .eq("reminder_3_day_sent", false)
      .eq("next_payment_date", threeDayDate);

    if (threeError) throw threeError;

    console.log(`Found ${sevenDaySchedules?.length || 0} 7-day reminders, ${threeDaySchedules?.length || 0} 3-day reminders`);

    const sentReminders = [];

    // Send 7-day reminders
    for (const schedule of sevenDaySchedules || []) {
      const app = schedule.loan_applications;
      if (!app?.email) continue;

      try {
        const formatCurrency = (amount: number) => 
          new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

        const emailResult = await resend.emails.send({
          from: "RenoCard <payments@resend.dev>",
          to: [app.email],
          subject: "Payment Reminder - 7 Days Until Your Next Payment",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #1a1a2e;">Payment Reminder</h1>
              <p>Hello ${app.first_name},</p>
              <p>This is a friendly reminder that your monthly payment of <strong>${formatCurrency(schedule.monthly_amount)}</strong> is due in <strong>7 days</strong> on ${new Date(schedule.next_payment_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.</p>
              <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Payment Details</h3>
                <p><strong>Amount Due:</strong> ${formatCurrency(schedule.monthly_amount)}</p>
                <p><strong>Due Date:</strong> ${new Date(schedule.next_payment_date).toLocaleDateString()}</p>
                <p><strong>Remaining Balance:</strong> ${formatCurrency(schedule.remaining_balance)}</p>
                <p><strong>Payments Remaining:</strong> ${schedule.total_payments - schedule.payments_made}</p>
              </div>
              <p>Your payment will be automatically processed on the due date using your saved payment method.</p>
              <p>If you have any questions or need to update your payment method, please log in to your account.</p>
              <p>Thank you for choosing RenoCard!</p>
              <p style="color: #666; font-size: 12px; margin-top: 30px;">This is an automated message. Please do not reply directly to this email.</p>
            </div>
          `,
        });

        console.log("Sent 7-day reminder to:", app.email, emailResult);

        // Mark reminder as sent
        await supabase
          .from("repayment_schedules")
          .update({ reminder_7_day_sent: true })
          .eq("id", schedule.id);

        // Log event
        await supabase.from("workflow_events").insert({
          application_id: schedule.application_id,
          event_type: "payment_reminder_7_day",
          event_data: { 
            email: app.email, 
            amount: schedule.monthly_amount,
            due_date: schedule.next_payment_date,
          },
          triggered_by: "system",
        });

        sentReminders.push({
          type: "7_day",
          email: app.email,
          scheduleId: schedule.id,
        });
      } catch (emailError) {
        console.error(`Failed to send 7-day reminder to ${app.email}:`, emailError);
      }
    }

    // Send 3-day reminders
    for (const schedule of threeDaySchedules || []) {
      const app = schedule.loan_applications;
      if (!app?.email) continue;

      try {
        const formatCurrency = (amount: number) => 
          new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

        const emailResult = await resend.emails.send({
          from: "RenoCard <payments@resend.dev>",
          to: [app.email],
          subject: "⚠️ Payment Due in 3 Days",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #d97706;">⚠️ Payment Due Soon</h1>
              <p>Hello ${app.first_name},</p>
              <p>Your monthly payment of <strong>${formatCurrency(schedule.monthly_amount)}</strong> is due in <strong>3 days</strong> on ${new Date(schedule.next_payment_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.</p>
              <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #d97706;">
                <h3 style="margin-top: 0; color: #92400e;">Payment Details</h3>
                <p><strong>Amount Due:</strong> ${formatCurrency(schedule.monthly_amount)}</p>
                <p><strong>Due Date:</strong> ${new Date(schedule.next_payment_date).toLocaleDateString()}</p>
                <p><strong>Remaining Balance:</strong> ${formatCurrency(schedule.remaining_balance)}</p>
              </div>
              <p><strong>Important:</strong> Please ensure your payment method has sufficient funds. A failed payment may result in your card being temporarily locked.</p>
              <p>Your payment will be automatically processed on the due date.</p>
              <p>Thank you for choosing RenoCard!</p>
              <p style="color: #666; font-size: 12px; margin-top: 30px;">This is an automated message. Please do not reply directly to this email.</p>
            </div>
          `,
        });

        console.log("Sent 3-day reminder to:", app.email, emailResult);

        // Mark reminder as sent
        await supabase
          .from("repayment_schedules")
          .update({ reminder_3_day_sent: true })
          .eq("id", schedule.id);

        // Log event
        await supabase.from("workflow_events").insert({
          application_id: schedule.application_id,
          event_type: "payment_reminder_3_day",
          event_data: { 
            email: app.email, 
            amount: schedule.monthly_amount,
            due_date: schedule.next_payment_date,
          },
          triggered_by: "system",
        });

        sentReminders.push({
          type: "3_day",
          email: app.email,
          scheduleId: schedule.id,
        });
      } catch (emailError) {
        console.error(`Failed to send 3-day reminder to ${app.email}:`, emailError);
      }
    }

    const result = {
      success: true,
      remindersSent: sentReminders.length,
      reminders: sentReminders,
    };

    console.log("Reminder job completed:", result);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Send reminders error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
