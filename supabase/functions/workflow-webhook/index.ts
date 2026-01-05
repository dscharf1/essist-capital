import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WorkflowRequest {
  action: string;
  applicationId?: string;
  data?: Record<string, unknown>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, applicationId, data }: WorkflowRequest = await req.json();
    console.log(`Workflow action: ${action}`, { applicationId, data });

    let result: Record<string, unknown> = {};

    switch (action) {
      case "submit_application": {
        // Step 1: Create the loan application
        const applicationData = data as {
          firstName: string;
          lastName: string;
          email: string;
          phone?: string;
          address?: string;
          city?: string;
          state?: string;
          zipCode?: string;
          projectType: string;
          projectDescription?: string;
          requestedAmount: number;
          materialsAmount: number;
          laborAmount: number;
          userId?: string;
        };

        const { data: application, error: appError } = await supabase
          .from("loan_applications")
          .insert({
            first_name: applicationData.firstName,
            last_name: applicationData.lastName,
            email: applicationData.email,
            phone: applicationData.phone,
            address: applicationData.address,
            city: applicationData.city,
            state: applicationData.state,
            zip_code: applicationData.zipCode,
            project_type: applicationData.projectType,
            project_description: applicationData.projectDescription,
            requested_amount: applicationData.requestedAmount,
            user_id: applicationData.userId || null,
            status: "submitted",
          })
          .select()
          .single();

        if (appError) throw appError;

        // Log the event
        await supabase.from("workflow_events").insert({
          application_id: application.id,
          event_type: "application_submitted",
          event_data: { ...applicationData },
          triggered_by: "user",
        });

        // Auto-trigger: Send DocuSign document
        const { data: document, error: docError } = await supabase
          .from("documents")
          .insert({
            application_id: application.id,
            document_type: "loan_agreement",
            status: "sent",
            sent_at: new Date().toISOString(),
            envelope_id: `ENV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          })
          .select()
          .single();

        if (docError) throw docError;

        // Update application status
        await supabase
          .from("loan_applications")
          .update({ status: "document_sent" })
          .eq("id", application.id);

        // Log document sent event
        await supabase.from("workflow_events").insert({
          application_id: application.id,
          event_type: "document_sent",
          event_data: { document_id: document.id, envelope_id: document.envelope_id },
          triggered_by: "system",
        });

        result = {
          success: true,
          applicationId: application.id,
          documentId: document.id,
          message: "Application submitted. Document sent for signature.",
          nextStep: "sign_document",
        };
        break;
      }

      case "sign_document": {
        // Step 2: Simulate DocuSign signature completion
        if (!applicationId) throw new Error("Application ID required");

        const { data: document, error: docFetchError } = await supabase
          .from("documents")
          .select("*")
          .eq("application_id", applicationId)
          .eq("document_type", "loan_agreement")
          .single();

        if (docFetchError) throw docFetchError;

        // Update document as signed
        await supabase
          .from("documents")
          .update({
            status: "signed",
            signed_at: new Date().toISOString(),
          })
          .eq("id", document.id);

        // Update application status
        await supabase
          .from("loan_applications")
          .update({ status: "document_signed" })
          .eq("id", applicationId);

        // Log signing event
        await supabase.from("workflow_events").insert({
          application_id: applicationId,
          event_type: "document_signed",
          event_data: { document_id: document.id, signed_at: new Date().toISOString() },
          triggered_by: "user",
        });

        // Auto-trigger: Provision the card
        const { data: application } = await supabase
          .from("loan_applications")
          .select("*")
          .eq("id", applicationId)
          .single();

        const materialsAmount = (data?.materialsAmount as number) || application.requested_amount * 0.6;
        const laborAmount = (data?.laborAmount as number) || application.requested_amount * 0.4;

        const { data: card, error: cardError } = await supabase
          .from("card_allocations")
          .insert({
            application_id: applicationId,
            card_number_masked: `****-****-****-${Math.floor(1000 + Math.random() * 9000)}`,
            total_amount: application.requested_amount,
            materials_amount: materialsAmount,
            labor_amount: laborAmount,
            materials_unlocked: true,
            labor_unlocked: false,
            merchant_category_lock: ["home_improvement", "building_materials", "hardware_stores"],
          })
          .select()
          .single();

        if (cardError) throw cardError;

        // Update application status
        await supabase
          .from("loan_applications")
          .update({ status: "card_provisioned" })
          .eq("id", applicationId);

        // Log card provisioning event
        await supabase.from("workflow_events").insert({
          application_id: applicationId,
          event_type: "card_provisioned",
          event_data: {
            card_id: card.id,
            materials_amount: materialsAmount,
            labor_amount: laborAmount,
            materials_unlocked: true,
            labor_unlocked: false,
          },
          triggered_by: "system",
        });

        result = {
          success: true,
          cardId: card.id,
          cardNumber: card.card_number_masked,
          materialsAvailable: materialsAmount,
          laborLocked: laborAmount,
          message: "Document signed. Card provisioned with materials funds unlocked.",
          nextStep: "start_project",
        };
        break;
      }

      case "start_project": {
        // Step 3: Mark project as started
        if (!applicationId) throw new Error("Application ID required");

        await supabase
          .from("loan_applications")
          .update({ status: "project_started" })
          .eq("id", applicationId);

        // Create inspection record
        const { data: inspection, error: inspError } = await supabase
          .from("inspections")
          .insert({
            application_id: applicationId,
            status: "pending",
          })
          .select()
          .single();

        if (inspError) throw inspError;

        await supabase.from("workflow_events").insert({
          application_id: applicationId,
          event_type: "project_started",
          event_data: { inspection_id: inspection.id },
          triggered_by: "contractor",
        });

        result = {
          success: true,
          inspectionId: inspection.id,
          message: "Project started. Inspection created for fund release.",
          nextStep: "request_inspection",
        };
        break;
      }

      case "request_inspection": {
        // Step 4: Request inspection
        if (!applicationId) throw new Error("Application ID required");

        const { data: inspection, error: inspFetchError } = await supabase
          .from("inspections")
          .select("*")
          .eq("application_id", applicationId)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (inspFetchError) throw inspFetchError;

        const scheduledDate = new Date();
        scheduledDate.setDate(scheduledDate.getDate() + 3);

        await supabase
          .from("inspections")
          .update({
            status: "scheduled",
            scheduled_date: scheduledDate.toISOString(),
            inspector_name: "John Inspector",
          })
          .eq("id", inspection.id);

        await supabase
          .from("loan_applications")
          .update({ status: "inspection_pending" })
          .eq("id", applicationId);

        await supabase.from("workflow_events").insert({
          application_id: applicationId,
          event_type: "inspection_scheduled",
          event_data: { inspection_id: inspection.id, scheduled_date: scheduledDate.toISOString() },
          triggered_by: "contractor",
        });

        result = {
          success: true,
          scheduledDate: scheduledDate.toISOString(),
          message: "Inspection scheduled. Awaiting completion.",
          nextStep: "complete_inspection",
        };
        break;
      }

      case "complete_inspection": {
        // Step 5: Complete inspection and release funds
        if (!applicationId) throw new Error("Application ID required");

        const passed = (data?.passed as boolean) ?? true;

        const { data: inspection, error: inspFetchError } = await supabase
          .from("inspections")
          .select("*")
          .eq("application_id", applicationId)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (inspFetchError) throw inspFetchError;

        await supabase
          .from("inspections")
          .update({
            status: "completed",
            completed_date: new Date().toISOString(),
            passed: passed,
            notes: data?.notes as string || (passed ? "Work completed satisfactorily" : "Work needs revision"),
          })
          .eq("id", inspection.id);

        await supabase.from("workflow_events").insert({
          application_id: applicationId,
          event_type: "inspection_completed",
          event_data: { inspection_id: inspection.id, passed },
          triggered_by: "inspector",
        });

        if (passed) {
          // Update application status
          await supabase
            .from("loan_applications")
            .update({ status: "inspection_passed" })
            .eq("id", applicationId);

          // Unlock labor funds on the card
          const { data: card, error: cardFetchError } = await supabase
            .from("card_allocations")
            .select("*")
            .eq("application_id", applicationId)
            .single();

          if (cardFetchError) throw cardFetchError;

          await supabase
            .from("card_allocations")
            .update({ labor_unlocked: true })
            .eq("id", card.id);

          await supabase
            .from("loan_applications")
            .update({ status: "funds_released" })
            .eq("id", applicationId);

          await supabase.from("workflow_events").insert({
            application_id: applicationId,
            event_type: "labor_funds_released",
            event_data: { card_id: card.id, labor_amount: card.labor_amount },
            triggered_by: "system",
          });

          result = {
            success: true,
            laborFundsReleased: card.labor_amount,
            message: "Inspection passed! Labor funds released to contractor.",
            nextStep: "completed",
          };
        } else {
          result = {
            success: true,
            passed: false,
            message: "Inspection failed. Work needs revision before funds can be released.",
            nextStep: "request_inspection",
          };
        }
        break;
      }

      case "get_status": {
        // Get current workflow status
        if (!applicationId) throw new Error("Application ID required");

        const { data: application, error: appError } = await supabase
          .from("loan_applications")
          .select("*")
          .eq("id", applicationId)
          .single();

        if (appError) throw appError;

        const { data: card } = await supabase
          .from("card_allocations")
          .select("*")
          .eq("application_id", applicationId)
          .maybeSingle();

        const { data: document } = await supabase
          .from("documents")
          .select("*")
          .eq("application_id", applicationId)
          .eq("document_type", "loan_agreement")
          .maybeSingle();

        const { data: inspection } = await supabase
          .from("inspections")
          .select("*")
          .eq("application_id", applicationId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        const { data: events } = await supabase
          .from("workflow_events")
          .select("*")
          .eq("application_id", applicationId)
          .order("created_at", { ascending: true });

        result = {
          application,
          card,
          document,
          inspection,
          events,
          currentStatus: application.status,
        };
        break;
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    console.log("Workflow result:", result);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Workflow error:", error);
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
