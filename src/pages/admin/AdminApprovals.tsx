import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { email as emailLib } from "@/lib/email";
import { formatCurrency, calculateAPR } from "@/lib/calculations";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  CheckCircle2, XCircle, Clock, Loader2, Download, Search,
  ChevronRight, X, FileText, User
} from "lucide-react";

type AppStatus = "pending" | "under_review" | "approved" | "rejected" | "funded" | "closed";

interface Application {
  id: string;
  user_id: string;
  borrower_type: string;
  loan_amount: number;
  term_months: number;
  monthly_payment: number;
  total_repayment: number;
  origination_fee: number;
  finance_charge: number;
  apr: number;
  project_type: string;
  project_description: string | null;
  property_address: string;
  property_city: string;
  property_state: string;
  property_zip: string;
  property_type: string;
  contractor_name: string | null;
  llc_name: string | null;
  ein: string | null;
  status: AppStatus;
  tila_accepted: boolean;
  tila_accepted_at: string | null;
  esignature_text: string | null;
  esignature_timestamp: string | null;
  admin_notes: string | null;
  created_at: string;
  profile?: { first_name: string; last_name: string; email: string; phone: string | null } | null;
}

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  under_review: "bg-blue-100 text-blue-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  funded: "bg-primary/10 text-primary",
  closed: "bg-muted text-muted-foreground",
};

const exportCSV = (data: Application[]) => {
  const headers = ["ID","Borrower","Email","Loan Amount","Term","Project","City","State","Status","Date"];
  const rows = data.map(a => [
    a.id, `${a.profile?.first_name || ""} ${a.profile?.last_name || ""}`.trim(),
    a.profile?.email || "", a.loan_amount, a.term_months,
    a.project_type, a.property_city, a.property_state, a.status,
    new Date(a.created_at).toLocaleDateString(),
  ]);
  const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = "applications.csv"; a.click();
};

const downloadApplicationPDF = (app: Application) => {
  const doc = new jsPDF({ unit: "mm", format: "letter" });
  const navy = [13, 31, 30] as [number, number, number];
  const gold = [13, 148, 136] as [number, number, number];
  const w = doc.internal.pageSize.getWidth();
  const name = (`${app.profile?.first_name || ""} ${app.profile?.last_name || ""}`.trim()) || app.profile?.email || "—";

  // Header
  doc.setFillColor(...navy);
  doc.rect(0, 0, w, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16); doc.setFont("helvetica", "bold");
  doc.text("ESSIST CAPITAL LLC", 14, 12);
  doc.setFontSize(9); doc.setFont("helvetica", "normal");
  doc.setTextColor(...gold);
  doc.text("LOAN APPLICATION SUMMARY", 14, 21);
  doc.setTextColor(200, 200, 200);
  doc.text(`Generated: ${new Date().toLocaleDateString("en-US", { dateStyle: "long" })}`, w - 14, 16, { align: "right" });
  doc.text(`Status: ${app.status.replace(/_/g, " ").toUpperCase()}`, w - 14, 22, { align: "right" });

  // Borrower
  doc.setTextColor(...navy); doc.setFontSize(10); doc.setFont("helvetica", "bold");
  doc.text("BORROWER INFORMATION", 14, 38);
  doc.setDrawColor(...gold); doc.line(14, 40, w - 14, 40);

  autoTable(doc, {
    startY: 43,
    body: [
      ["Full Name", name, "Email", app.profile?.email || "—"],
      ["Phone", app.profile?.phone || "—", "Borrower Type", (app.borrower_type || "individual").toUpperCase()],
      ...(app.llc_name ? [["LLC Name", app.llc_name, "EIN", app.ein || "—"]] : []),
    ],
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: { 0: { fontStyle: "bold", textColor: [100,100,100], cellWidth: 38 }, 2: { fontStyle: "bold", textColor: [100,100,100], cellWidth: 38 } },
    theme: "plain",
    alternateRowStyles: { fillColor: [248, 248, 252] },
  });

  // Loan details
  const afterBorrower = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;
  doc.setTextColor(...navy); doc.setFontSize(10); doc.setFont("helvetica", "bold");
  doc.text("LOAN DETAILS", 14, afterBorrower);
  doc.setDrawColor(...gold); doc.line(14, afterBorrower + 2, w - 14, afterBorrower + 2);

  autoTable(doc, {
    startY: afterBorrower + 5,
    body: [
      ["Loan Amount", formatCurrency(app.loan_amount), "Term", `${app.term_months} months`],
      ["Monthly Payment", formatCurrency(app.monthly_payment), "APR", `${app.apr?.toFixed(2) || "—"}%`],
      ["Finance Charge", formatCurrency(app.finance_charge), "Origination Fee (2.5%)", formatCurrency(app.origination_fee)],
      ["Total of Payments", formatCurrency(app.total_repayment), "", ""],
    ],
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: { 0: { fontStyle: "bold", textColor: [100,100,100], cellWidth: 48 }, 2: { fontStyle: "bold", textColor: [100,100,100], cellWidth: 48 } },
    theme: "plain",
    alternateRowStyles: { fillColor: [248, 248, 252] },
  });

  // Property & project
  const afterLoan = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;
  doc.setTextColor(...navy); doc.setFontSize(10); doc.setFont("helvetica", "bold");
  doc.text("PROPERTY & PROJECT", 14, afterLoan);
  doc.setDrawColor(...gold); doc.line(14, afterLoan + 2, w - 14, afterLoan + 2);

  autoTable(doc, {
    startY: afterLoan + 5,
    body: [
      ["Property Address", `${app.property_address}, ${app.property_city}, ${app.property_state} ${app.property_zip}`],
      ["Property Type", (app.property_type || "—").replace(/_/g, " ")],
      ["Project Type", app.project_type || "—"],
      ...(app.contractor_name ? [["Contractor", app.contractor_name]] : []),
      ...(app.project_description ? [["Description", app.project_description]] : []),
    ],
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: { 0: { fontStyle: "bold", textColor: [100,100,100], cellWidth: 48 } },
    theme: "plain",
    alternateRowStyles: { fillColor: [248, 248, 252] },
  });

  // TILA & Signature
  const afterProp = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;
  doc.setTextColor(...navy); doc.setFontSize(10); doc.setFont("helvetica", "bold");
  doc.text("TILA DISCLOSURE & E-SIGNATURE", 14, afterProp);
  doc.setDrawColor(...gold); doc.line(14, afterProp + 2, w - 14, afterProp + 2);

  autoTable(doc, {
    startY: afterProp + 5,
    body: [
      ["TILA Accepted", app.tila_accepted ? "YES" : "NO", "Accepted At", app.tila_accepted_at ? new Date(app.tila_accepted_at).toLocaleString() : "—"],
      ["E-Signature", app.esignature_text || "—", "Signed At", app.esignature_timestamp ? new Date(app.esignature_timestamp).toLocaleString() : "—"],
    ],
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: { 0: { fontStyle: "bold", textColor: [100,100,100], cellWidth: 38 }, 2: { fontStyle: "bold", textColor: [100,100,100], cellWidth: 38 } },
    theme: "plain",
    alternateRowStyles: { fillColor: [248, 248, 252] },
  });

  // Admin notes
  if (app.admin_notes) {
    const afterSig = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;
    doc.setTextColor(...navy); doc.setFontSize(10); doc.setFont("helvetica", "bold");
    doc.text("ADMIN NOTES", 14, afterSig);
    doc.setDrawColor(...gold); doc.line(14, afterSig + 2, w - 14, afterSig + 2);
    doc.setTextColor(80, 80, 80); doc.setFontSize(9); doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(app.admin_notes, w - 28);
    doc.text(lines, 14, afterSig + 8);
  }

  // Footer
  const ph = doc.internal.pageSize.getHeight();
  doc.setFillColor(...navy); doc.rect(0, ph - 16, w, 16, "F");
  doc.setTextColor(180, 180, 180); doc.setFontSize(7); doc.setFont("helvetica", "normal");
  doc.text(`Application ID: ${app.id}`, 14, ph - 8);
  doc.text("Essist Capital LLC · NJ & NY Licensed · dscharf@essistcap.com", w / 2, ph - 8, { align: "center" });
  doc.text(`Printed: ${new Date().toLocaleDateString()}`, w - 14, ph - 8, { align: "right" });

  doc.save(`essist-application-${name.replace(/\s+/g, "-").toLowerCase()}-${new Date().toISOString().slice(0, 10)}.pdf`);
};

const AdminApprovals = () => {
  const { toast } = useToast();
  const [apps, setApps] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Application | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [statusChange, setStatusChange] = useState<AppStatus>("pending");
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchApps(); }, []);

  const fetchApps = async () => {
    setIsLoading(true);

    // Fetch all applications (pending + under_review + approved/funded so admin can manage any)
    const { data: appData, error } = await supabase
      .from("applications")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !appData) { setIsLoading(false); return; }

    // Fetch profiles for all applicants
    const userIds = [...new Set(appData.map((a) => a.user_id))];
    const { data: profileData } = await supabase
      .from("profiles")
      .select("user_id, first_name, last_name, email, phone")
      .in("user_id", userIds);

    const profileMap = Object.fromEntries((profileData || []).map((p) => [p.user_id, p]));
    const merged = appData.map((a) => ({ ...a, profile: profileMap[a.user_id] || null }));
    setApps(merged as Application[]);
    setIsLoading(false);
  };

  const openApp = (app: Application) => {
    setSelected(app);
    setAdminNotes(app.admin_notes || "");
    setStatusChange(app.status);
  };

  const saveStatus = async (newStatus: AppStatus) => {
    if (!selected) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("applications")
        .update({ status: newStatus, admin_notes: adminNotes, updated_at: new Date().toISOString() })
        .eq("id", selected.id);
      if (error) throw error;

      // Trigger emails
      if (newStatus === "approved" || newStatus === "funded") { try { await emailLib.onStatusApproved(selected.id); } catch (_) {} }
      if (newStatus === "rejected") { try { await emailLib.onStatusRejected(selected.id, adminNotes); } catch (_) {} }

      toast({ title: "Status updated", description: `Application marked as ${newStatus}` });
      setSelected(null);
      fetchApps();
    } catch {
      toast({ title: "Failed to update status", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const filtered = apps.filter(a => {
    if (statusFilter !== "all" && a.status !== statusFilter) return false;
    if (!search) return true;
    const name = `${a.profile?.first_name || ""} ${a.profile?.last_name || ""}`.toLowerCase();
    return name.includes(search.toLowerCase()) || a.property_city.toLowerCase().includes(search.toLowerCase()) || a.project_type.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#0d1f1e]">Applications</h1>
          <p className="text-xs text-gray-400 mt-0.5">{filtered.length} of {apps.length} total</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => exportCSV(filtered)}>
          <Download className="w-4 h-4 mr-1.5" />Export
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
          <Input className="pl-9 bg-white border-gray-200" placeholder="Search name, city, project..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 bg-white border-gray-200"><SelectValue placeholder="All statuses" /></SelectTrigger>
          <SelectContent>
            {["all","pending","under_review","approved","rejected","funded","closed"].map(s => (
              <SelectItem key={s} value={s} className="capitalize">{s === "all" ? "All Statuses" : s.replace(/_/g," ")}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-[#0d1f1e]" /></div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">
            <Clock className="w-8 h-8 mx-auto mb-3 opacity-30" />No applications found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {["Applicant","Amount","Project","Location","Status","Date",""].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(app => (
                  <tr key={app.id} className="hover:bg-gray-50/70 cursor-pointer transition-colors" onClick={() => openApp(app)}>
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-[#0d1f1e]">
                        {(`${app.profile?.first_name || ""} ${app.profile?.last_name || ""}`.trim()) || app.profile?.email || "—"}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{app.profile?.email}</p>
                    </td>
                    <td className="px-5 py-3.5 font-bold text-[#0d1f1e]">{formatCurrency(app.loan_amount)}</td>
                    <td className="px-5 py-3.5 capitalize text-gray-500">{app.project_type}</td>
                    <td className="px-5 py-3.5 text-gray-400">{app.property_city}, {app.property_state}</td>
                    <td className="px-5 py-3.5">
                      <Badge className={STATUS_BADGE[app.status] + " text-xs"}>{app.status.replace(/_/g," ")}</Badge>
                    </td>
                    <td className="px-5 py-3.5 text-gray-400 text-xs">{new Date(app.created_at).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</td>
                    <td className="px-5 py-3.5"><ChevronRight className="w-4 h-4 text-gray-300" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Side Panel */}
      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSelected(null)} />
          <div className="relative w-full max-w-2xl bg-white shadow-2xl overflow-y-auto flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-background">
              <h2 className="font-bold text-lg">Application Details</h2>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => downloadApplicationPDF(selected)}>
                  <FileText className="w-4 h-4 mr-1.5" />Download PDF
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setSelected(null)}><X className="w-5 h-5" /></Button>
              </div>
            </div>
            <div className="p-6 space-y-5 flex-1">
              {/* Borrower */}
              <section>
                <h3 className="font-semibold mb-2 flex items-center gap-2 text-[#0d1f1e]"><User className="w-4 h-4" />Borrower</h3>
                <div className="grid grid-cols-2 gap-3 text-sm bg-muted p-4 rounded-xl">
                  <div><p className="text-muted-foreground text-xs">Name</p><p className="font-medium">{selected.profile?.first_name} {selected.profile?.last_name}</p></div>
                  <div><p className="text-muted-foreground text-xs">Email</p><p>{selected.profile?.email}</p></div>
                  <div><p className="text-muted-foreground text-xs">Phone</p><p>{selected.profile?.phone || "—"}</p></div>
                  <div><p className="text-muted-foreground text-xs">Type</p><p className="capitalize">{selected.borrower_type}</p></div>
                  {selected.llc_name && <div><p className="text-muted-foreground text-xs">LLC</p><p>{selected.llc_name}</p></div>}
                  {selected.ein && <div><p className="text-muted-foreground text-xs">EIN</p><p>{selected.ein}</p></div>}
                </div>
              </section>

              {/* Loan */}
              <section>
                <h3 className="font-semibold mb-2 text-[#0d1f1e]">Loan Details</h3>
                <div className="bg-[#0d1f1e] text-white p-4 rounded-xl grid grid-cols-2 gap-3 text-sm">
                  <div><p className="text-white/60 text-xs">Loan Amount</p><p className="font-bold text-[#0d9488] text-lg">{formatCurrency(selected.loan_amount)}</p></div>
                  <div><p className="text-white/60 text-xs">Term</p><p className="font-medium">{selected.term_months} months</p></div>
                  <div><p className="text-white/60 text-xs">Monthly Payment</p><p className="font-medium">{formatCurrency(selected.monthly_payment)}</p></div>
                  <div><p className="text-white/60 text-xs">APR</p><p className="font-medium">{selected.apr?.toFixed(2)}%</p></div>
                  <div><p className="text-white/60 text-xs">Finance Charge</p><p>{formatCurrency(selected.finance_charge)}</p></div>
                  <div><p className="text-white/60 text-xs">Origination Fee</p><p>{formatCurrency(selected.origination_fee)}</p></div>
                </div>
              </section>

              {/* Property */}
              <section>
                <h3 className="font-semibold mb-2 text-[#0d1f1e]">Property</h3>
                <div className="bg-muted p-4 rounded-xl text-sm">
                  <p>{selected.property_address}, {selected.property_city}, {selected.property_state} {selected.property_zip}</p>
                  <p className="text-muted-foreground capitalize mt-1">{selected.property_type?.replace(/_/g," ")}</p>
                </div>
              </section>

              {/* Project */}
              <section>
                <h3 className="font-semibold mb-2 text-[#0d1f1e]">Project</h3>
                <div className="bg-muted p-4 rounded-xl text-sm space-y-1">
                  <p><span className="text-muted-foreground">Type: </span><span className="capitalize font-medium">{selected.project_type}</span></p>
                  {selected.contractor_name && <p><span className="text-muted-foreground">Contractor: </span>{selected.contractor_name}</p>}
                  {selected.project_description && <p className="text-muted-foreground mt-2">{selected.project_description}</p>}
                </div>
              </section>

              {/* TILA + E-Sig */}
              <section>
                <h3 className="font-semibold mb-2 flex items-center gap-2 text-[#0d1f1e]"><FileText className="w-4 h-4" />TILA &amp; Signature</h3>
                <div className="bg-muted p-4 rounded-xl text-sm space-y-2">
                  <div className="flex items-center gap-2">
                    {selected.tila_accepted
                      ? <CheckCircle2 className="w-4 h-4 text-green-600" />
                      : <XCircle className="w-4 h-4 text-red-500" />}
                    <span>TILA Disclosure {selected.tila_accepted ? "accepted" : "not accepted"}</span>
                    {selected.tila_accepted_at && <span className="text-muted-foreground text-xs ml-auto">{new Date(selected.tila_accepted_at).toLocaleString()}</span>}
                  </div>
                  {selected.esignature_text && (
                    <div className="border rounded-lg p-3 bg-white">
                      <p className="text-xs text-muted-foreground mb-1">Electronic Signature</p>
                      <p className="font-serif text-lg">{selected.esignature_text}</p>
                      <p className="text-xs text-muted-foreground mt-1">{selected.esignature_timestamp ? new Date(selected.esignature_timestamp).toLocaleString() : ""}</p>
                    </div>
                  )}
                </div>
              </section>

              {/* Admin Notes */}
              <section>
                <h3 className="font-semibold mb-2 text-[#0d1f1e]">Admin Notes</h3>
                <Textarea rows={3} value={adminNotes} onChange={e => setAdminNotes(e.target.value)} placeholder="Add notes for this application..." />
              </section>

              {/* Status + Actions */}
              <section className="space-y-3">
                <div className="flex items-center gap-3">
                  <Select value={statusChange} onValueChange={v => setStatusChange(v as AppStatus)}>
                    <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["pending","under_review","approved","rejected","funded","closed"].map(s => (
                        <SelectItem key={s} value={s} className="capitalize">{s.replace(/_/g," ")}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={() => saveStatus(statusChange)} disabled={saving} className="bg-[#0d1f1e] text-white hover:bg-[#1a3330]">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
                  </Button>
                </div>
                <div className="flex gap-3">
                  <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white" onClick={() => saveStatus("approved")} disabled={saving}>
                    <CheckCircle2 className="w-4 h-4 mr-2" />Approve
                  </Button>
                  <Button variant="outline" className="flex-1 border-red-300 text-red-600 hover:bg-red-50" onClick={() => saveStatus("rejected")} disabled={saving}>
                    <XCircle className="w-4 h-4 mr-2" />Reject
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={() => saveStatus("under_review")} disabled={saving}>
                    <Clock className="w-4 h-4 mr-2" />Under Review
                  </Button>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminApprovals;
