import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PaymentSetupRequest {
  action: "create_customer" | "create_setup_intent" | "save_payment_method" | "get_payment_methods";
  applicationId?: string;
  userId: string;
  email: string;
  name?: string;
  paymentType?: "card" | "ach";
  paymentMethodId?: string;
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

    const { action, applicationId, userId, email, name, paymentType, paymentMethodId }: PaymentSetupRequest = await req.json();
    console.log(`Stripe payment action: ${action}`, { applicationId, userId, paymentType });

    let result: Record<string, unknown> = {};

    switch (action) {
      case "create_customer": {
        // Check if customer already exists
        const { data: existingMethod } = await supabase
          .from("payment_methods")
          .select("stripe_customer_id")
          .eq("user_id", userId)
          .limit(1)
          .maybeSingle();

        let customerId = existingMethod?.stripe_customer_id;

        if (!customerId) {
          // Create new Stripe customer
          const customer = await stripe.customers.create({
            email,
            name: name || email,
            metadata: { user_id: userId },
          });
          customerId = customer.id;
          console.log("Created Stripe customer:", customerId);
        }

        result = { customerId };
        break;
      }

      case "create_setup_intent": {
        // Get or create customer first
        let customerId: string;
        
        const { data: existingMethod } = await supabase
          .from("payment_methods")
          .select("stripe_customer_id")
          .eq("user_id", userId)
          .limit(1)
          .maybeSingle();

        if (existingMethod?.stripe_customer_id) {
          customerId = existingMethod.stripe_customer_id;
        } else {
          const customer = await stripe.customers.create({
            email,
            name: name || email,
            metadata: { user_id: userId },
          });
          customerId = customer.id;
        }

        // Create SetupIntent for the selected payment type
        const paymentMethodTypes = paymentType === "ach" 
          ? ["us_bank_account"] 
          : ["card"];

        const setupIntent = await stripe.setupIntents.create({
          customer: customerId,
          payment_method_types: paymentMethodTypes,
          usage: "off_session",
          metadata: {
            user_id: userId,
            application_id: applicationId || "",
          },
        });

        console.log("Created SetupIntent:", setupIntent.id);

        result = {
          clientSecret: setupIntent.client_secret,
          customerId,
          setupIntentId: setupIntent.id,
        };
        break;
      }

      case "save_payment_method": {
        if (!paymentMethodId) throw new Error("Payment method ID required");

        // Retrieve the payment method from Stripe
        const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
        console.log("Retrieved payment method:", paymentMethod.id, paymentMethod.type);

        // Get customer ID
        const customerId = paymentMethod.customer as string;

        // Prepare data based on payment type
        let last_four: string | null = null;
        let brand: string | null = null;
        let bank_name: string | null = null;
        let payment_type: "card" | "ach" = "card";

        if (paymentMethod.type === "card" && paymentMethod.card) {
          last_four = paymentMethod.card.last4;
          brand = paymentMethod.card.brand;
          payment_type = "card";
        } else if (paymentMethod.type === "us_bank_account" && paymentMethod.us_bank_account) {
          last_four = paymentMethod.us_bank_account.last4;
          bank_name = paymentMethod.us_bank_account.bank_name;
          payment_type = "ach";
        }

        // Set as default payment method for the customer
        await stripe.customers.update(customerId, {
          invoice_settings: {
            default_payment_method: paymentMethodId,
          },
        });

        // Save to database
        const { data: savedMethod, error } = await supabase
          .from("payment_methods")
          .insert({
            user_id: userId,
            application_id: applicationId || null,
            stripe_customer_id: customerId,
            stripe_payment_method_id: paymentMethodId,
            payment_type,
            last_four,
            brand,
            bank_name,
            is_default: true,
          })
          .select()
          .single();

        if (error) throw error;

        console.log("Saved payment method to database:", savedMethod.id);

        result = {
          success: true,
          paymentMethod: savedMethod,
        };
        break;
      }

      case "get_payment_methods": {
        const { data: methods, error } = await supabase
          .from("payment_methods")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });

        if (error) throw error;

        result = { paymentMethods: methods };
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
    console.error("Stripe payment error:", error);
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
