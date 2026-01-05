import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface WorkflowState {
  applicationId: string | null;
  currentStatus: string | null;
  cardInfo: {
    cardNumber: string;
    materialsAmount: number;
    laborAmount: number;
    materialsUnlocked: boolean;
    laborUnlocked: boolean;
  } | null;
  documentStatus: string | null;
  inspectionStatus: string | null;
  isLoading: boolean;
  error: string | null;
}

export const useWorkflow = () => {
  const { toast } = useToast();
  const [state, setState] = useState<WorkflowState>({
    applicationId: null,
    currentStatus: null,
    cardInfo: null,
    documentStatus: null,
    inspectionStatus: null,
    isLoading: false,
    error: null,
  });

  const callWorkflow = useCallback(
    async (action: string, applicationId?: string, data?: Record<string, unknown>) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const { data: result, error } = await supabase.functions.invoke("workflow-webhook", {
          body: { action, applicationId, data },
        });

        if (error) throw error;

        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Workflow error";
        setState((prev) => ({ ...prev, error: message }));
        toast({
          title: "Error",
          description: message,
          variant: "destructive",
        });
        throw err;
      } finally {
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    },
    [toast]
  );

  const submitApplication = useCallback(
    async (applicationData: {
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
    }) => {
      const result = await callWorkflow("submit_application", undefined, applicationData);

      setState((prev) => ({
        ...prev,
        applicationId: result.applicationId,
        currentStatus: "document_sent",
        documentStatus: "sent",
      }));

      toast({
        title: "Application Submitted!",
        description: "Please check your email to sign the loan agreement.",
      });

      return result;
    },
    [callWorkflow, toast]
  );

  const signDocument = useCallback(
    async (applicationId: string, materialsAmount?: number, laborAmount?: number) => {
      const result = await callWorkflow("sign_document", applicationId, {
        materialsAmount,
        laborAmount,
      });

      setState((prev) => ({
        ...prev,
        currentStatus: "card_provisioned",
        documentStatus: "signed",
        cardInfo: {
          cardNumber: result.cardNumber,
          materialsAmount: result.materialsAvailable,
          laborAmount: result.laborLocked,
          materialsUnlocked: true,
          laborUnlocked: false,
        },
      }));

      toast({
        title: "Document Signed!",
        description: "Your card has been provisioned with materials funds unlocked.",
      });

      return result;
    },
    [callWorkflow, toast]
  );

  const startProject = useCallback(
    async (applicationId: string) => {
      const result = await callWorkflow("start_project", applicationId);

      setState((prev) => ({
        ...prev,
        currentStatus: "project_started",
        inspectionStatus: "pending",
      }));

      toast({
        title: "Project Started!",
        description: "An inspection has been created for fund release.",
      });

      return result;
    },
    [callWorkflow, toast]
  );

  const requestInspection = useCallback(
    async (applicationId: string) => {
      const result = await callWorkflow("request_inspection", applicationId);

      setState((prev) => ({
        ...prev,
        currentStatus: "inspection_pending",
        inspectionStatus: "scheduled",
      }));

      toast({
        title: "Inspection Scheduled!",
        description: `Inspection scheduled for ${new Date(result.scheduledDate).toLocaleDateString()}`,
      });

      return result;
    },
    [callWorkflow, toast]
  );

  const completeInspection = useCallback(
    async (applicationId: string, passed: boolean, notes?: string) => {
      const result = await callWorkflow("complete_inspection", applicationId, { passed, notes });

      if (passed) {
        setState((prev) => ({
          ...prev,
          currentStatus: "funds_released",
          inspectionStatus: "passed",
          cardInfo: prev.cardInfo
            ? { ...prev.cardInfo, laborUnlocked: true }
            : null,
        }));

        toast({
          title: "Inspection Passed!",
          description: "Labor funds have been released to the contractor.",
        });
      } else {
        setState((prev) => ({
          ...prev,
          inspectionStatus: "failed",
        }));

        toast({
          title: "Inspection Failed",
          description: "Work needs revision before funds can be released.",
          variant: "destructive",
        });
      }

      return result;
    },
    [callWorkflow, toast]
  );

  const getStatus = useCallback(
    async (applicationId: string) => {
      const result = await callWorkflow("get_status", applicationId);

      setState((prev) => ({
        ...prev,
        applicationId,
        currentStatus: result.currentStatus,
        documentStatus: result.document?.status || null,
        inspectionStatus: result.inspection?.status || null,
        cardInfo: result.card
          ? {
              cardNumber: result.card.card_number_masked,
              materialsAmount: result.card.materials_amount,
              laborAmount: result.card.labor_amount,
              materialsUnlocked: result.card.materials_unlocked,
              laborUnlocked: result.card.labor_unlocked,
            }
          : null,
      }));

      return result;
    },
    [callWorkflow]
  );

  return {
    ...state,
    submitApplication,
    signDocument,
    startProject,
    requestInspection,
    completeInspection,
    getStatus,
  };
};
