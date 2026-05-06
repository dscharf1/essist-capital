import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/calculations";
import { Loader2, ArrowRight, Pencil, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const STATUS_DOT: Record<string, string> = {
  pending:      "bg-yellow-400",
  under_review: "bg-blue-400",
  approved:     "bg-emerald-400",
  rejected:     "bg-red-400",
  funded:       "bg-[#0d9488]",
  active:       "bg-[#0d9488]",
  closed:       "bg-gray-300",
};

interface AppRow { id: string; user_id: string; status: string; loan_amount: number; project_type: string; created_at: string; borrowerName?: string; }
interface Metrics { id: string; total_funded: number; total_collected: number; notes: string | null; }

const AdminDashboard = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [apps, setApps] = useState<AppRow[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [editingMetrics, setEditingMetrics] = useState(false);
  const [editFunded, setEditFunded] = useState("");
  const [editCollected, setEditCollected] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [savingMetrics, setSavingMetrics] = useState(false);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [appsRes, profilesRes, metricsRes] = await Promise.all([
      supabase.from("applications").select("id, user_id, status, loan_amount, project_type, created_at").order("created_at", { ascending: false }),
      supabase.from("profiles").select("user_id, first_name, last_name, email"),
      supabase.from("admin_metrics").select("*").limit(1).maybeSingle(),
    ]);

    const profileMap: Record<string, string> = {};
    for (const p of profilesRes.data || []) {
      const name = `${p.first_name || ""} ${p.last_name || ""}`.trim();
      profileMap[p.user_id] = name || p.email || "";
    }

    const appData = (appsRes.data || []).map(a => ({
      ...a,
      borrowerName: profileMap[a.user_id] || a.user_id.slice(0, 8) + "…",
    })) as AppRow[];

    setApps(appData);
    setMetrics(metricsRes.data as Metrics || null);
    setLoading(false);
  };

  const startEditMetrics = () => {
    setEditFunded(String(metrics?.total_funded ?? 0));
    setEditCollected(String(metrics?.total_collected ?? 0));
    setEditNotes(metrics?.notes || "");
    setEditingMetrics(true);
  };

  const saveMetrics = async () => {
    setSavingMetrics(true);
    try {
      const funded = parseFloat(editFunded) || 0;
      const collected = parseFloat(editCollected) || 0;
      if (metrics?.id) {
        const { error } = await supabase.from("admin_metrics").update({
          total_funded: funded, total_collected: collected, notes: editNotes || null, updated_at: new Date().toISOString(),
        }).eq("id", metrics.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("admin_metrics").insert({
          total_funded: funded, total_collected: collected, notes: editNotes || null,
        });
        if (error) throw error;
      }
      toast({ title: "Metrics updated" });
      setEditingMetrics(false);
      fetchAll();
    } catch {
      toast({ title: "Failed to save", variant: "destructive" });
    } finally { setSavingMetrics(false); }
  };

  const active = apps.filter(a => ["funded", "active"].includes(a.status));
  const closed = apps.filter(a => a.status === "closed");
  const pending = apps.filter(a => a.status === "pending").length;

  // Auto-calculate funded amount from all disbursed loans (funded + active + closed)
  const autoFunded = [...active, ...closed].reduce((sum, a) => sum + (a.loan_amount || 0), 0);

  const pipeline = ["pending", "under_review", "approved", "funded", "rejected"].map(s => ({
    label: s.replace(/_/g, " "), key: s,
    count: apps.filter(a => a.status === s).length,
  }));

  const kpis = [
    { label: "Total Applications", value: apps.length.toString() },
    { label: "Active Loans",       value: active.length.toString() },
    { label: "Closed Loans",       value: closed.length.toString() },
    { label: "Amount Funded",      value: formatCurrency(autoFunded), highlight: true },
    { label: "Collected",          value: formatCurrency(metrics?.total_collected ?? 0) },
    { label: "Awaiting Review",    value: pending.toString(), urgent: pending > 0 },
  ];

  if (loading) return (
    <div className="flex justify-center py-32">
      <Loader2 className="w-6 h-6 animate-spin text-[#0d1f1e]" />
    </div>
  );

  return (
    <div className="space-y-6 max-w-5xl">

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpis.map(k => (
          <div key={k.label} className="bg-white rounded-2xl p-4 border border-gray-100">
            <p className="text-xs text-gray-400 font-medium mb-1.5 leading-tight">{k.label}</p>
            <p className={`text-xl font-black ${k.urgent ? "text-amber-500" : k.highlight ? "text-[#0d9488]" : "text-[#0d1f1e]"}`}>{k.value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1fr,300px] gap-6">

        {/* Recent Applications */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <p className="font-semibold text-sm text-[#0d1f1e]">Recent Applications</p>
            <Link to="/admin/approvals" className="flex items-center gap-1 text-xs text-[#0d9488] font-semibold hover:opacity-80">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-50">
                {["Borrower","Amount","Project","Status","Date"].map(h => (
                  <th key={h} className="px-5 py-2.5 text-left text-xs font-semibold text-gray-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {apps.slice(0, 8).map(a => (
                <tr key={a.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-5 py-3 font-medium text-[#0d1f1e]">{a.borrowerName}</td>
                  <td className="px-5 py-3 font-semibold">{formatCurrency(a.loan_amount)}</td>
                  <td className="px-5 py-3 capitalize text-gray-500">{a.project_type}</td>
                  <td className="px-5 py-3">
                    <span className="flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[a.status] || "bg-gray-300"}`} />
                      <span className="capitalize text-gray-600 text-xs">{a.status.replace(/_/g, " ")}</span>
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-400 text-xs">{new Date(a.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</td>
                </tr>
              ))}
              {apps.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-10 text-center text-gray-400 text-sm">No applications yet</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Right column */}
        <div className="space-y-4">

          {/* Pipeline */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="font-semibold text-sm text-[#0d1f1e] mb-4">Pipeline</p>
            <div className="space-y-3">
              {pipeline.map(p => {
                const pct = apps.length > 0 ? (p.count / apps.length) * 100 : 0;
                return (
                  <div key={p.key}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="capitalize text-gray-500 font-medium">{p.label}</span>
                      <span className="font-bold text-[#0d1f1e]">{p.count}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, background: ["funded","approved"].includes(p.key) ? "#0d9488" : p.key === "rejected" ? "#f87171" : "#0d1f1e" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Manual Metrics Tracker */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="font-semibold text-sm text-[#0d1f1e]">Funding Tracker</p>
              {!editingMetrics ? (
                <button onClick={startEditMetrics}
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-[#0d1f1e] transition-colors font-medium">
                  <Pencil className="w-3 h-3" />Update
                </button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={saveMetrics} disabled={savingMetrics}
                    className="flex items-center gap-1 text-xs text-emerald-600 hover:opacity-80 font-semibold">
                    {savingMetrics ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}Save
                  </button>
                  <button onClick={() => setEditingMetrics(false)} className="text-gray-400 hover:text-[#0d1f1e]">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {!editingMetrics ? (
              <div className="space-y-3">
                <div className="rounded-xl p-3 bg-gray-50">
                  <p className="text-xs text-gray-400 mb-1">Total Funded</p>
                  <p className="text-xl font-black text-[#0d9488]">{formatCurrency(metrics?.total_funded ?? 0)}</p>
                </div>
                <div className="rounded-xl p-3 bg-gray-50">
                  <p className="text-xs text-gray-400 mb-1">Total Collected</p>
                  <p className="text-xl font-black text-[#0d1f1e]">{formatCurrency(metrics?.total_collected ?? 0)}</p>
                </div>
                {metrics?.notes && (
                  <p className="text-xs text-gray-400 italic px-1">{metrics.notes}</p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500 font-medium">Total Funded ($)</label>
                  <input type="number" value={editFunded} onChange={e => setEditFunded(e.target.value)}
                    className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm text-[#0d1f1e] font-semibold focus:outline-none focus:ring-2 focus:ring-[#0d9488]/30" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-medium">Total Collected ($)</label>
                  <input type="number" value={editCollected} onChange={e => setEditCollected(e.target.value)}
                    className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm text-[#0d1f1e] font-semibold focus:outline-none focus:ring-2 focus:ring-[#0d9488]/30" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-medium">Notes (optional)</label>
                  <input type="text" value={editNotes} onChange={e => setEditNotes(e.target.value)}
                    placeholder="e.g. as of Apr 2026"
                    className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#0d9488]/30" />
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
