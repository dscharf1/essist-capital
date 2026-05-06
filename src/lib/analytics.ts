/**
 * Essist Capital — Google Analytics 4 helpers
 */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined;

/** Initialize GA4 — call once in main.tsx or App.tsx */
export function initAnalytics() {
  if (!GA_ID) return;

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function (...args: unknown[]) {
    window.dataLayer!.push(args);
  };
  window.gtag('js', new Date());
  window.gtag('config', GA_ID);
}

function trackEvent(eventName: string, params?: Record<string, unknown>) {
  if (!window.gtag) return;
  window.gtag('event', eventName, params);
}

export const analytics = {
  pageView(path: string) {
    trackEvent('page_view', { page_path: path });
  },
  applicationStarted() {
    trackEvent('application_started');
  },
  applicationCompleted(loanAmount: number) {
    trackEvent('application_completed', { loan_amount: loanAmount });
  },
  cardIssued(applicationId: string) {
    trackEvent('card_issued', { application_id: applicationId });
  },
  documentUploaded(documentType: string) {
    trackEvent('document_uploaded', { document_type: documentType });
  },
  login(method: string) {
    trackEvent('login', { method });
  },
  signUp(method: string) {
    trackEvent('sign_up', { method });
  },
};
