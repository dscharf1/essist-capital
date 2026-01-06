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
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    console.log(`Checking for missed payments before: ${yesterdayStr}`);

    // Get schedules with overdue payments (payment date has passed)
    const { data: overdueSchedules, error: schedError } = await supabase
      .from("repayment_schedules")
      .select(`
        *,
        loan_applications:application_id (
          id,
          first_name,
          last_name,
          email
        ),
        card_allocations:application_id (
          id,
          card_number_masked,
          materials_unlocked,
          labor_unlocked
        )
      `)
      .eq("status", "active")
      .lt("next_payment_date", yesterdayStr);

    if (schedError) throw schedError;

    console.log(`Found ${overdueSchedules?.length || 0} overdue schedules`);

    const lockedCards = [];

    for (const schedule of overdueSchedules || []) {
      const app = schedule.loan_applications;
      const cards = schedule.card_allocations;

      // Check if there's a successful payment for the due date
      const { data: successfulPayment } = await supabase
        .from("payments")
        .select("id")
        .eq("schedule_id", schedule.id)
        .eq("payment_date", schedule.next_payment_date)
        .eq("status", "succeeded")
        .maybeSingle();

      if (successfulPayment) {
        console.log(`Schedule ${schedule.id} has a successful payment, skipping`);
        continue;
      }

      // Check for any failed payments that haven't been resolved
      const { data: failedPayments } = await supabase
        .from("payments")
        .select("*")
        .eq("schedule_id", schedule.id)
        .eq("status", "failed")
        .order("created_at", { ascending: false })
        .limit(1);

      console.log(`Schedule ${schedule.id} has missed payment, locking card`);

      // Lock the card (set both materials and labor to locked)
      if (cards && Array.isArray(cards)) {
        for (const card of cards) {
          await supabase
            .from("card_allocations")
            .update({
              materials_unlocked: false,
              labor_unlocked: false,
            })
            .eq("id", card.id);

          lockedCards.push({
            cardId: card.id,
            cardNumber: card.card_number_masked,
            applicationId: schedule.application_id,
          });
        }
      }

      // Update schedule status to defaulted
      await supabase
        .from("repayment_schedules")
        .update({ status: "defaulted" })
        .eq("id", schedule.id);

      // Log workflow event
      await supabase.from("workflow_events").insert({
        application_id: schedule.application_id,
        event_type: "card_locked_missed_payment",
        event_data: {
          schedule_id: schedule.id,
          missed_payment_date: schedule.next_payment_date,
          amount_due: schedule.monthly_amount,
        },
        triggered_by: "system",
      });

      // Send notification email
      if (app?.email) {
        try {
          const formatCurrency = (amount: number) =>
            new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

          await resend.emails.send({
            from: "RenoCard <payments@resend.dev>",
            to: [app.email],
            subject: "🚨 Important: Your Card Has Been Temporarily Locked",
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #dc2626;">🚨 Card Temporarily Locked</h1>
                <p>Hello ${app.first_name},</p>
                <p>We were unable to process your scheduled payment of <strong>${formatCurrency(schedule.monthly_amount)}</strong> that was due on ${new Date(schedule.next_payment_date).toLocaleDateString()}.</p>
                <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
                  <h3 style="margin-top: 0; color: #991b1b;">Account Status</h3>
                  <p><strong>Amount Overdue:</strong> ${formatCurrency(schedule.monthly_amount)}</p>
                  <p><strong>Original Due Date:</strong> ${new Date(schedule.next_payment_date).toLocaleDateString()}</p>
                  <p><strong>Card Status:</strong> <span style="color: #dc2626; font-weight: bold;">LOCKED</span></p>
                </div>
                <p>Your RenoCard has been temporarily locked to protect your account. To restore access:</p>
                <ol>
                  <li>Log in to your account</li>
                  <li>Update your payment method if needed</li>
                  <li>Make the overdue payment</li>
                </ol>
                <p>Once the payment is received, your card will be automatically unlocked within 24 hours.</p>
                <p>If you believe this is an error or need assistance, please contact our support team immediately.</p>
                <p style="color: #666; font-size: 12px; margin-top: 30px;">This is an automated message. Please do not reply directly to this email.</p>
              </div>
            `,
          });

          console.log("Sent card locked notification to:", app.email);

          await supabase.from("workflow_events").insert({
            application_id: schedule.application_id,
            event_type: "missed_payment_notification_sent",
            event_data: { email: app.email },
            triggered_by: "system",
          });
        } catch (emailError) {
          console.error(`Failed to send locked card notification to ${app.email}:`, emailError);
        }
      }
    }

    const result = {
      success: true,
      overdueChecked: overdueSchedules?.length || 0,
      cardsLocked: lockedCards.length,
      lockedCards,
    };

    console.log("Missed payment check completed:", result);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Check missed payments error:", error);
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
