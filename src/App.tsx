import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import Homeowners from "./pages/Homeowners";
import Contractors from "./pages/Contractors";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Resources from "./pages/Resources";
import Apply from "./pages/Apply";
import ApplicationStatus from "./pages/ApplicationStatus";
import PaymentSetup from "./pages/PaymentSetup";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";

// Admin pages
import AdminLayout from "./components/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminClients from "./pages/admin/AdminClients";
import AdminApprovals from "./pages/admin/AdminApprovals";
import AdminDocuments from "./pages/admin/AdminDocuments";
import AdminCards from "./pages/admin/AdminCards";
import AdminPayments from "./pages/admin/AdminPayments";
import AdminCronJobs from "./pages/admin/AdminCronJobs";
import AdminNotifications from "./pages/admin/AdminNotifications";
import AdminAuditLog from "./pages/admin/AdminAuditLog";
import AdminContactMessages from "./pages/admin/AdminContactMessages";
import AdminTransactions from "./pages/admin/AdminTransactions";
import AdminSettings from "./pages/admin/AdminSettings";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { analytics, initAnalytics } from "@/lib/analytics";

const queryClient = new QueryClient();

// GA4 page view tracker
const PageTracker = () => {
  const location = useLocation();
  useEffect(() => { analytics.pageView(location.pathname); }, [location]);
  return null;
};

const App = () => {
  useEffect(() => { initAnalytics(); }, []);
  return (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <PageTracker />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/homeowners" element={<Homeowners />} />
            <Route path="/contractors" element={<Contractors />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/resources" element={<Navigate to="/" replace />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/login" element={<Navigate to="/auth" replace />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            
            {/* Protected User Routes */}
            <Route path="/apply" element={
              <ProtectedRoute>
                <Apply />
              </ProtectedRoute>
            } />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/application/:id" element={
              <ProtectedRoute>
                <ApplicationStatus />
              </ProtectedRoute>
            } />
            <Route path="/application/:applicationId/payments" element={
              <ProtectedRoute>
                <PaymentSetup />
              </ProtectedRoute>
            } />
            
            {/* Admin Routes (Protected) */}
            <Route path="/admin" element={
              <ProtectedRoute requireAdmin>
                <AdminLayout />
              </ProtectedRoute>
            }>
              <Route index element={<AdminDashboard />} />
              <Route path="clients" element={<AdminClients />} />
              <Route path="approvals" element={<AdminApprovals />} />
              <Route path="documents" element={<AdminDocuments />} />
              <Route path="cards" element={<AdminCards />} />
              <Route path="payments" element={<AdminPayments />} />
              <Route path="cron-jobs" element={<AdminCronJobs />} />
              <Route path="notifications" element={<AdminNotifications />} />
              <Route path="audit-log" element={<AdminAuditLog />} />
              <Route path="contact-messages" element={<AdminContactMessages />} />
              <Route path="transactions" element={<AdminTransactions />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;
