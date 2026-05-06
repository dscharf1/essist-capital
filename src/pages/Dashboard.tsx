import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Loader2, Bell, Upload, FileText, ArrowRight, Phone, CheckCircle2,
} from 'lucide-react';
import {
  formatCurrency,
  calculateMonthlyPayment,
  calculateFinanceCharge,
  calculateOriginationFee,
  calculateAPR,
  getDisplayRate,
} from '@/lib/calculations';
import { useToast } from '@/hooks/use-toast';
import type { Application, Notification, Document } from '@/types/database';

const STATUS_STEPS = ['Applied', 'Under Review', 'Approved', 'Funded'];
const STATUS_TO_STEP: Record<string, number> = {
  pending: 0, under_review: 1, approved: 2, funded: 3, active: 3, closed: 3,
};

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  pending:      { label: 'Pending',      color: 'bg-yellow-100 text-yellow-800' },
  under_review: { label: 'Under Review', color: 'bg-blue-100 text-blue-800' },
  approved:     { label: 'Approved',     color: 'bg-emerald-100 text-emerald-800' },
  funded:       { label: 'Funded',       color: 'bg-[#0d9488]/15 text-[#0d9488]' },
  active:       { label: 'Active',       color: 'bg-[#0d9488]/15 text-[#0d9488]' },
  closed:       { label: 'Closed',       color: 'bg-gray-100 text-gray-500' },
};

const Dashboard = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [applications, setApplications]   = useState<Application[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [quoteDoc, setQuoteDoc]           = useState<Document | null>(null);
  const [activeApp, setActiveApp]         = useState<Application | null>(null);
  const [isLoading, setIsLoading]         = useState(true);
  const [notifOpen, setNotifOpen]         = useState(false);
  const [uploading, setUploading]         = useState(false);

  useEffect(() => { if (user) fetchAll(); }, [user]);

  // Live notification listener
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`notif-${user.id}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        (payload) => { setNotifications(prev => [payload.new as Notification, ...prev]); }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const fetchAll = async () => {
    setIsLoading(true);
    try {
      const [appsRes, notifsRes] = await Promise.all([
        supabase.from('applications').select('*').eq('user_id', user!.id).order('created_at', { ascending: false }),
        supabase.from('notifications').select('*').eq('user_id', user!.id).order('created_at', { ascending: false }).limit(10),
      ]);

      const apps = (appsRes.data as Application[]) || [];
      setApplications(apps);
      setNotifications((notifsRes.data as Notification[]) || []);

      const active = apps.find(a => ['funded', 'active', 'approved'].includes(a.status)) || apps[0] || null;
      setActiveApp(active);

      if (active) {
        const docsRes = await supabase
          .from('documents').select('*')
          .eq('application_id', active.id)
          .eq('document_type', 'contractor_quote')
          .order('uploaded_at', { ascending: false })
          .limit(1).maybeSingle();
        setQuoteDoc((docsRes.data as Document) || null);
      }
    } catch (err) {
      console.error('Dashboard error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const markRead = async () => {
    const unread = notifications.filter(n => !n.read).map(n => n.id);
    if (!unread.length) return;
    await supabase.from('notifications').update({ read: true }).in('id', unread);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const uploadQuote = async (file: File) => {
    if (!user || !activeApp) return;
    setUploading(true);
    try {
      const path = `${user.id}/${activeApp.id}/contractor_quote-${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from('documents').upload(path, file);
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(path);
      await supabase.from('documents').insert({
        application_id: activeApp.id,
        user_id: user.id,
        document_type: 'contractor_quote',
        file_url: publicUrl,
        file_name: file.name,
        verified: false,
      });
      toast({ title: 'Quote uploaded', description: 'Your contractor quote is pending review.' });
      fetchAll();
    } catch {
      toast({ title: 'Upload failed', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const stepIdx = activeApp ? (STATUS_TO_STEP[activeApp.status] ?? 0) : 0;

  if (isLoading) return (
    <div className="min-h-screen bg-[#f8f9fb]">
      <Header />
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="w-7 h-7 animate-spin text-[#0d1f1e]" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      <Header />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">

          {/* Top bar */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-[#0d1f1e]">
                {profile?.first_name ? `Hi, ${profile.first_name}.` : 'My Dashboard'}
              </h1>
              <p className="text-sm text-gray-400 mt-0.5">
                {activeApp
                  ? `${activeApp.project_type?.replace(/_/g, ' ')} · ${formatCurrency(activeApp.loan_amount)}`
                  : 'No active application'}
              </p>
            </div>

            {/* Notification bell */}
            <div className="relative">
              <button
                onClick={() => { setNotifOpen(o => !o); markRead(); }}
                className="relative w-9 h-9 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-[#0d1f1e] transition-colors shadow-sm"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>
              {notifOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">Notifications</div>
                  {notifications.length === 0 ? (
                    <p className="px-4 py-5 text-sm text-gray-400 text-center">Nothing new</p>
                  ) : (
                    <div className="max-h-64 overflow-y-auto divide-y divide-gray-50">
                      {notifications.map(n => (
                        <div key={n.id} className={`px-4 py-3 ${!n.read ? 'bg-blue-50/50' : ''}`}>
                          <p className="text-sm font-medium text-[#0d1f1e]">{n.title}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{n.message}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* No application */}
          {applications.length === 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
              <FileText className="w-10 h-10 mx-auto mb-4 text-gray-200" />
              <p className="font-semibold text-[#0d1f1e] mb-1">No application yet</p>
              <p className="text-sm text-gray-400 mb-6">Apply in 10 minutes — no hard credit pull</p>
              <Button asChild className="bg-[#0d1f1e] text-white hover:bg-[#1a3330]">
                <Link to="/apply">Apply Now <ArrowRight className="w-4 h-4 ml-2" /></Link>
              </Button>
            </div>
          )}

          {activeApp && (
            <div className="space-y-5">

              {/* Status stepper */}
              <div className="bg-white rounded-2xl border border-gray-100 px-6 py-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Application Status</p>
                  {(() => {
                    const s = STATUS_LABEL[activeApp.status];
                    return s ? (
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${s.color}`}>{s.label}</span>
                    ) : null;
                  })()}
                </div>

                <div className="relative flex items-center">
                  <div className="absolute top-3.5 left-4 right-4 h-0.5 bg-gray-100">
                    <div className="h-0.5 bg-[#0d1f1e] transition-all duration-700"
                      style={{ width: `${(stepIdx / (STATUS_STEPS.length - 1)) * 100}%` }} />
                  </div>
                  {STATUS_STEPS.map((label, i) => (
                    <div key={label} className="flex-1 flex flex-col items-center relative z-10">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        i < stepIdx  ? 'bg-[#0d1f1e] text-white' :
                        i === stepIdx ? 'bg-[#0d9488] text-[#0d1f1e] ring-4 ring-[#0d9488]/20' :
                        'bg-gray-100 text-gray-400'
                      }`}>
                        {i < stepIdx ? <CheckCircle2 className="w-3.5 h-3.5" /> : i + 1}
                      </div>
                      <span className="text-[10px] mt-1.5 text-gray-400 hidden sm:block text-center">{label}</span>
                    </div>
                  ))}
                </div>

                {/* Status message */}
                <div className="mt-5 rounded-xl p-4 text-sm"
                  style={{ background: activeApp.status === 'approved' || activeApp.status === 'funded' || activeApp.status === 'active'
                    ? 'rgba(13,148,136,0.08)' : 'rgba(13,31,30,0.03)' }}>
                  {activeApp.status === 'pending' && (
                    <p className="text-gray-500">Your application has been submitted. We'll review it and be in touch within 24 hours.</p>
                  )}
                  {activeApp.status === 'under_review' && (
                    <p className="text-blue-700">Your application is under review. Our team is currently evaluating your request.</p>
                  )}
                  {activeApp.status === 'approved' && (
                    <p className="text-[#0d9488] font-medium">Congratulations — your application has been approved! A member of our team will reach out shortly with next steps.</p>
                  )}
                  {(activeApp.status === 'funded' || activeApp.status === 'active') && (
                    <p className="text-[#0d9488] font-medium">Your loan is funded and active. Your virtual card has been issued via Baselane — check your email for access details.</p>
                  )}
                  {activeApp.status === 'closed' && (
                    <p className="text-gray-400">This loan has been closed.</p>
                  )}
                </div>
              </div>

              {/* Loan Details */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-50">
                  <p className="font-semibold text-[#0d1f1e] text-sm">Loan Details</p>
                  <p className="text-xs text-gray-400 mt-0.5 capitalize">{activeApp.project_type?.replace(/_/g, ' ')} · {activeApp.property_city}, {activeApp.property_state}</p>
                </div>
                <div className="p-5">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {[
                      { label: 'Loan Amount',      value: formatCurrency(activeApp.loan_amount),                               gold: true },
                      { label: 'Term',             value: `${activeApp.term_months} months` },
                      { label: 'Monthly Payment',  value: formatCurrency(calculateMonthlyPayment(activeApp.loan_amount, activeApp.term_months)) },
                      { label: 'Rate',             value: getDisplayRate(activeApp.term_months) },
                      { label: 'Finance Charge',   value: formatCurrency(calculateFinanceCharge(activeApp.loan_amount, activeApp.term_months)) },
                      { label: 'Origination Fee',  value: formatCurrency(calculateOriginationFee(activeApp.loan_amount)) },
                      { label: 'APR',              value: `${calculateAPR(activeApp.loan_amount, activeApp.term_months).toFixed(2)}%` },
                      { label: 'Total Repayment',  value: formatCurrency(activeApp.loan_amount + calculateFinanceCharge(activeApp.loan_amount, activeApp.term_months) + calculateOriginationFee(activeApp.loan_amount)) },
                    ].map(item => (
                      <div key={item.label} className="rounded-xl p-3 bg-gray-50">
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">{item.label}</p>
                        <p className={`text-sm font-bold ${item.gold ? 'text-[#0d9488]' : 'text-[#0d1f1e]'}`}>{item.value}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-4">
                    Applied {new Date(activeApp.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    {' · '}ID: <span className="font-mono">{activeApp.id.slice(0, 12)}…</span>
                  </p>
                </div>
              </div>

              {/* Contractor Quote */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-[#0d1f1e] text-sm">Contractor Quote</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {quoteDoc
                        ? quoteDoc.verified ? 'Verified by Essist Capital' : `Uploaded · ${quoteDoc.file_name}`
                        : 'Upload your contractor quote for review'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {quoteDoc && (
                      <Badge className={quoteDoc.verified ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}>
                        {quoteDoc.verified ? 'Verified' : 'Pending'}
                      </Badge>
                    )}
                    <label className="cursor-pointer">
                      <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png"
                        onChange={e => { const f = e.target.files?.[0]; if (f) uploadQuote(f); }} />
                      <Button variant="outline" size="sm" disabled={uploading} className="pointer-events-none" asChild>
                        <span>
                          {uploading
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                            : <Upload className="w-3.5 h-3.5 mr-1.5" />}
                          {quoteDoc ? 'Replace' : 'Upload'}
                        </span>
                      </Button>
                    </label>
                  </div>
                </div>
              </div>

              {/* Footer actions */}
              <div className="flex items-center justify-between pt-2 pb-4">
                <Button asChild variant="ghost" size="sm" className="text-gray-400 hover:text-[#0d1f1e]">
                  <Link to="/apply"><ArrowRight className="w-4 h-4 mr-1.5" />New Application</Link>
                </Button>
                <Button asChild variant="ghost" size="sm" className="text-gray-400 hover:text-[#0d1f1e]">
                  <Link to="/contact"><Phone className="w-4 h-4 mr-1.5" />Contact Support</Link>
                </Button>
              </div>

            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Dashboard;
