/**
 * Essist Capital — Email trigger helpers (calls Supabase Edge Functions)
 */
import { supabase } from '@/integrations/supabase/client';

async function invokeEmailFunction(fnName: string, payload: Record<string, unknown>) {
  const { error } = await supabase.functions.invoke(fnName, { body: payload });
  if (error) {
    console.error(`Email function ${fnName} failed:`, error);
    throw error;
  }
}

export const email = {
  async onApplicationSubmit(applicationId: string) {
    return invokeEmailFunction('on_application_submit', { applicationId });
  },
  async onStatusApproved(applicationId: string) {
    return invokeEmailFunction('on_status_approved', { applicationId });
  },
  async onStatusRejected(applicationId: string, reason?: string) {
    return invokeEmailFunction('on_status_rejected', { applicationId, reason });
  },
  async onCardIssued(applicationId: string) {
    return invokeEmailFunction('on_card_issued', { applicationId });
  },
  async sendNotification(userId: string, title: string, message: string) {
    return invokeEmailFunction('send_notification', { userId, title, message });
  },
};
