import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ProcessPaymentRequest {
  action: "process_scheduled_payments" | "process_single_payment" | "retry_failed_payment";
  paymentId?: string;
  scheduleId?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      throw new Error("Stripe secret key not configured");
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, paymentId, scheduleId }: ProcessPaymentRequest = await req.json();
    console.log(`Process payment action: ${action}`, { paymentId, scheduleId });

    let result: Record<string, unknown> = {};

    switch (action) {
      case "process_scheduled_payments": {
        // Get all active schedules where today is the payment date
        const today = new Date().toISOString().split('T')[0];
        
        const { data: dueSchedules, error: schedError } = await supabase
          .from("repayment_schedules")
          .select(`
            *,
            payment_methods:payment_method_id (
              stripe_customer_id,
              stripe_payment_method_id
            ),
            loan_applications:application_id (
              first_name,
              last_name,
              email
            )
          `)
          .eq("status", "active")
          .lte("next_payment_date", today);

        if (schedError) throw schedError;

        console.log(`Found ${dueSchedules?.length || 0} schedules due for payment`);

        const processedPayments = [];

        for (const schedule of dueSchedules || []) {
          if (!schedule.payment_methods?.stripe_payment_method_id) {
            console.log(`Schedule ${schedule.id} has no payment method, skipping`);
            continue;
          }

          try {
            // Create a payment record
            const { data: payment, error: paymentError } = await supabase
              .from("payments")
              .insert({
                schedule_id: schedule.id,
                application_id: schedule.application_id,
                amount: schedule.monthly_amount,
                status: "processing",
                payment_date: today,
              })
              .select()
              .single();

            if (paymentError) throw paymentError;

            // Process the payment with Stripe
            const paymentIntent = await stripe.paymentIntents.create({
              amount: Math.round(schedule.monthly_amount * 100), // Convert to cents
              currency: "usd",
              customer: schedule.payment_methods.stripe_customer_id,
              payment_method: schedule.payment_methods.stripe_payment_method_id,
              off_session: true,
              confirm: true,
              metadata: {
                schedule_id: schedule.id,
                payment_id: payment.id,
                application_id: schedule.application_id,
              },
            });

            // Update payment record
            await supabase
              .from("payments")
              .update({
                stripe_payment_intent_id: paymentIntent.id,
                status: paymentIntent.status === "succeeded" ? "succeeded" : "processing",
                processed_at: new Date().toISOString(),
              })
              .eq("id", payment.id);

            if (paymentIntent.status === "succeeded") {
              // Update schedule
              const newPaymentsMade = schedule.payments_made + 1;
              const newRemainingBalance = schedule.remaining_balance - schedule.monthly_amount;
              const nextPaymentDate = new Date(schedule.next_payment_date);
              nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);

              const isCompleted = newPaymentsMade >= schedule.total_payments;

              await supabase
                .from("repayment_schedules")
                .update({
                  payments_made: newPaymentsMade,
                  remaining_balance: Math.max(0, newRemainingBalance),
                  next_payment_date: nextPaymentDate.toISOString().split('T')[0],
                  status: isCompleted ? "completed" : "active",
                  reminder_7_day_sent: false,
                  reminder_3_day_sent: false,
                })
                .eq("id", schedule.id);

              // Log workflow event
              await supabase.from("workflow_events").insert({
                application_id: schedule.application_id,
                event_type: "payment_processed",
                event_data: {
                  payment_id: payment.id,
                  amount: schedule.monthly_amount,
                  payments_made: newPaymentsMade,
                  remaining_balance: Math.max(0, newRemainingBalance),
                },
                triggered_by: "system",
              });
            }

            processedPayments.push({
              scheduleId: schedule.id,
              paymentId: payment.id,
              status: paymentIntent.status,
              amount: schedule.monthly_amount,
            });
          } catch (paymentError) {
            console.error(`Failed to process payment for schedule ${schedule.id}:`, paymentError);
            
            // Record failed payment
            await supabase
              .from("payments")
              .insert({
                schedule_id: schedule.id,
                application_id: schedule.application_id,
                amount: schedule.monthly_amount,
                status: "failed",
                payment_date: today,
                failure_reason: paymentError instanceof Error ? paymentError.message : "Payment failed",
              });

            processedPayments.push({
              scheduleId: schedule.id,
              status: "failed",
              error: paymentError instanceof Error ? paymentError.message : "Unknown error",
            });
          }
        }

        result = {
          processed: processedPayments.length,
          payments: processedPayments,
        };
        break;
      }

      case "process_single_payment": {
        if (!scheduleId) throw new Error("Schedule ID required");

        const { data: schedule, error: schedError } = await supabase
          .from("repayment_schedules")
          .select(`
            *,
            payment_methods:payment_method_id (
              stripe_customer_id,
              stripe_payment_method_id
            )
          `)
          .eq("id", scheduleId)
          .single();

        if (schedError) throw schedError;
        if (!schedule.payment_methods?.stripe_payment_method_id) {
          throw new Error("No payment method configured");
        }

        const today = new Date().toISOString().split('T')[0];

        // Create payment record
        const { data: payment, error: paymentError } = await supabase
          .from("payments")
          .insert({
            schedule_id: schedule.id,
            application_id: schedule.application_id,
            amount: schedule.monthly_amount,
            status: "processing",
            payment_date: today,
          })
          .select()
          .single();

        if (paymentError) throw paymentError;

        // Process with Stripe
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(schedule.monthly_amount * 100),
          currency: "usd",
          customer: schedule.payment_methods.stripe_customer_id,
          payment_method: schedule.payment_methods.stripe_payment_method_id,
          off_session: true,
          confirm: true,
          metadata: {
            schedule_id: schedule.id,
            payment_id: payment.id,
          },
        });

        // Update payment record
        await supabase
          .from("payments")
          .update({
            stripe_payment_intent_id: paymentIntent.id,
            status: paymentIntent.status === "succeeded" ? "succeeded" : "failed",
            processed_at: new Date().toISOString(),
          })
          .eq("id", payment.id);

        if (paymentIntent.status === "succeeded") {
          // Update schedule
          const newPaymentsMade = schedule.payments_made + 1;
          const newRemainingBalance = schedule.remaining_balance - schedule.monthly_amount;
          const nextPaymentDate = new Date(schedule.next_payment_date);
          nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);

          await supabase
            .from("repayment_schedules")
            .update({
              payments_made: newPaymentsMade,
              remaining_balance: Math.max(0, newRemainingBalance),
              next_payment_date: nextPaymentDate.toISOString().split('T')[0],
              status: newPaymentsMade >= schedule.total_payments ? "completed" : "active",
              reminder_7_day_sent: false,
              reminder_3_day_sent: false,
            })
            .eq("id", schedule.id);
        }

        result = {
          success: paymentIntent.status === "succeeded",
          paymentId: payment.id,
          status: paymentIntent.status,
        };
        break;
      }

      case "retry_failed_payment": {
        if (!paymentId) throw new Error("Payment ID required");

        const { data: payment, error: payError } = await supabase
          .from("payments")
          .select(`
            *,
            repayment_schedules:schedule_id (
              payment_methods:payment_method_id (
                stripe_customer_id,
                stripe_payment_method_id
              )
            )
          `)
          .eq("id", paymentId)
          .single();

        if (payError) throw payError;

        const paymentMethod = payment.repayment_schedules?.payment_methods;
        if (!paymentMethod?.stripe_payment_method_id) {
          throw new Error("No payment method found");
        }

        // Retry with Stripe
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(payment.amount * 100),
          currency: "usd",
          customer: paymentMethod.stripe_customer_id,
          payment_method: paymentMethod.stripe_payment_method_id,
          off_session: true,
          confirm: true,
        });

        await supabase
          .from("payments")
          .update({
            stripe_payment_intent_id: paymentIntent.id,
            status: paymentIntent.status === "succeeded" ? "succeeded" : "failed",
            processed_at: new Date().toISOString(),
          })
          .eq("id", paymentId);

        result = {
          success: paymentIntent.status === "succeeded",
          status: paymentIntent.status,
        };
        break;
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Process payment error:", error);
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
