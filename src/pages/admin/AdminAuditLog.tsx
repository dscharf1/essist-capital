import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Shield, Search, X, Download, FileText } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface AuditEntry {
  id: string;
  admin_user_id: string;
  action_type: string;
  target_table: string;
  target_id: string;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
  admin_email?: string;
}

const ACTION_COLORS: Record<string, string> = {
  update:      "bg-blue-100 text-blue-800",
  approve:     "bg-green-100 text-green-800",
  reject:      "bg-red-100 text-red-800",
  issue_card:  "bg-purple-100 text-purple-800",
  freeze_card: "bg-amber-100 text-amber-800",
  mark_paid:   "bg-green-100 text-green-800",
  delete:      "bg-red-100 text-red-800",
  insert:      "bg-gray-100 text-gray-800",
};

/** Compute keys that changed between old and new */
function diffKeys(oldVal: Record<string, unknown> | null, newVal: Record<string, unknown> | null): string[] {
  if (!oldVal || !newVal) return [];
  return Object.keys({ ...oldVal, ...newVal }).filter(
    k => JSON.stringify(oldVal[k]) !== JSON.stringify(newVal[k])
  );
}

const exportAuditPDF = (data: AuditEntry[]) => {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const generatedAt = new Date().toLocaleString("en-US", { dateStyle: "full", timeStyle: "short" });

  // ── Header ──
  doc.setFillColor(13, 31, 30);          // #0d1f1e
  doc.rect(0, 0, 297, 28, "F");

  doc.setTextColor(13, 148, 136);        // gold
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("ESSIST CAPITAL", 14, 11);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.text("Admin Audit Log", 14, 20);

  doc.setTextColor(180, 180, 180);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(`Generated: ${generatedAt}`, 297 - 14, 11, { align: "right" });
  doc.text(`${data.length} record${data.length !== 1 ? "s" : ""} (filtered view)`, 297 - 14, 18, { align: "right" });

  // ── Confidentiality notice ──
  doc.setTextColor(120, 120, 120);
  doc.setFontSize(7);
  doc.text(
    "CONFIDENTIAL — For authorized use only. This document contains privileged audit information. Do not distribute without authorization.",
    14, 26
  );

  // ── Table ──
  autoTable(doc, {
    startY: 32,
    head: [["Timestamp", "Admin", "Action", "Table", "Record ID", "Changed Fields", "Before", "After"]],
    body: data.map(log => {
      const changed = diffKeys(log.old_value, log.new_value);
      return [
        new Date(log.created_at).toLocaleString("en-US", {
          month: "short", day: "numeric", year: "numeric",
          hour: "numeric", minute: "2-digit", hour12: true,
        }),
        log.admin_email || log.admin_user_id?.slice(0, 12) + "…",
        log.action_type,
        log.target_table,
        log.target_id ? log.target_id.slice(0, 8) + "…" : "—",
        changed.length > 0 ? changed.join(", ") : log.new_value ? "new record" : "—",
        log.old_value ? JSON.stringify(log.old_value).slice(0, 80) + (JSON.stringify(log.old_value).length > 80 ? "…" : "") : "—",
        log.new_value ? JSON.stringify(log.new_value).slice(0, 80) + (JSON.stringify(log.new_value).length > 80 ? "…" : "") : "—",
      ];
    }),
    styles: {
      fontSize: 7,
      cellPadding: 2.5,
      overflow: "linebreak",
      lineColor: [230, 230, 230],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [13, 31, 30],
      textColor: [13, 148, 136],
      fontStyle: "bold",
      fontSize: 7.5,
    },
    alternateRowStyles: {
      fillColor: [248, 248, 252],
    },
    columnStyles: {
      0: { cellWidth: 32 },  // timestamp
      1: { cellWidth: 28 },  // admin
      2: { cellWidth: 20 },  // action
      3: { cellWidth: 22 },  // table
      4: { cellWidth: 22 },  // record id
      5: { cellWidth: 30 },  // changed fields
      6: { cellWidth: 60 },  // before
      7: { cellWidth: 60 },  // after
    },
    didDrawPage: (hookData) => {
      // Footer on every page
      const pageCount = (doc as jsPDF & { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages();
      doc.setFontSize(7);
      doc.setTextColor(160, 160, 160);
      doc.text(
        `Page ${hookData.pageNumber} of ${pageCount} · Essist Capital Audit Log · ${generatedAt}`,
        297 / 2,
        doc.internal.pageSize.height - 5,
        { align: "center" }
      );
    },
  });

  // ── Summary page (if any detailed entries) ──
  if (data.length > 0) {
    const actionCounts: Record<string, number> = {};
    data.forEach(l => { actionCounts[l.action_type] = (actionCounts[l.action_type] || 0) + 1; });

    doc.addPage();
    doc.setFillColor(13, 31, 30);
    doc.rect(0, 0, 297, 20, "F");
    doc.setTextColor(13, 148, 136);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Audit Summary", 14, 13);

    autoTable(doc, {
      startY: 26,
      head: [["Action Type", "Count"]],
      body: Object.entries(actionCounts).sort((a, b) => b[1] - a[1]).map(([k, v]) => [k, String(v)]),
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [13, 31, 30], textColor: [13, 148, 136], fontStyle: "bold" },
      columnStyles: { 0: { cellWidth: 60 }, 1: { cellWidth: 30 } },
    });
  }

  const filename = `essist_audit_log_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
};

const exportSingleEntryPDF = (log: AuditEntry) => {
  const doc = new jsPDF({ unit: "mm", format: "letter" });
  const navy = [13, 31, 30] as [number, number, number];
  const gold = [13, 148, 136] as [number, number, number];
  const w = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(...navy);
  doc.rect(0, 0, w, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16); doc.setFont("helvetica", "bold");
  doc.text("ESSIST CAPITAL LLC", 14, 12);
  doc.setFontSize(9); doc.setFont("helvetica", "normal");
  doc.setTextColor(...gold);
  doc.text("AUDIT LOG ENTRY", 14, 21);
  doc.setTextColor(200, 200, 200);
  doc.text(`Generated: ${new Date().toLocaleDateString("en-US", { dateStyle: "long" })}`, w - 14, 21, { align: "right" });

  // Metadata
  doc.setTextColor(...navy); doc.setFontSize(10); doc.setFont("helvetica", "bold");
  doc.text("ENTRY DETAILS", 14, 38);
  doc.setDrawColor(...gold); doc.line(14, 40, w - 14, 40);

  autoTable(doc, {
    startY: 43,
    body: [
      ["Action", log.action_type.toUpperCase(), "Table", log.target_table],
      ["Record ID", log.target_id || "—", "IP Address", log.ip_address || "—"],
      ["Admin User", log.admin_email || log.admin_user_id, "Timestamp", new Date(log.created_at).toLocaleString("en-US", { dateStyle: "full", timeStyle: "short" })],
    ],
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: { 0: { fontStyle: "bold", textColor: [100,100,100], cellWidth: 38 }, 2: { fontStyle: "bold", textColor: [100,100,100], cellWidth: 38 } },
    theme: "plain",
    alternateRowStyles: { fillColor: [248, 248, 252] },
  });

  // Field changes
  const changed = diffKeys(log.old_value, log.new_value);
  const allKeys = Array.from(new Set([
    ...Object.keys(log.old_value || {}),
    ...Object.keys(log.new_value || {}),
  ]));

  if (allKeys.length > 0) {
    const afterMeta = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;
    doc.setTextColor(...navy); doc.setFontSize(10); doc.setFont("helvetica", "bold");
    doc.text(`FIELD CHANGES (${changed.length} changed)`, 14, afterMeta);
    doc.setDrawColor(...gold); doc.line(14, afterMeta + 2, w - 14, afterMeta + 2);

    autoTable(doc, {
      startY: afterMeta + 5,
      head: [["Field", "Before", "After"]],
      body: allKeys.map(key => {
        const isChanged = changed.includes(key);
        const oldV = log.old_value?.[key];
        const newV = log.new_value?.[key];
        return [
          key,
          oldV === undefined ? "—" : String(JSON.stringify(oldV)).replace(/^"|"$/g, ""),
          newV === undefined ? "—" : String(JSON.stringify(newV)).replace(/^"|"$/g, ""),
        ];
      }),
      styles: { fontSize: 8, cellPadding: 2.5, overflow: "linebreak" },
      headStyles: { fillColor: navy, textColor: gold, fontStyle: "bold", fontSize: 8 },
      bodyStyles: { textColor: [60, 60, 60] },
      didParseCell: (data) => {
        if (data.section === "body" && changed.includes(allKeys[data.row.index])) {
          if (data.column.index === 1) { data.cell.styles.textColor = [180, 50, 50]; data.cell.styles.fontStyle = "italic"; }
          if (data.column.index === 2) { data.cell.styles.textColor = [30, 130, 60]; data.cell.styles.fontStyle = "bold"; }
          if (data.column.index === 0) { data.cell.styles.fontStyle = "bold"; }
        }
      },
      columnStyles: { 0: { cellWidth: 45 }, 1: { cellWidth: 65 }, 2: { cellWidth: 65 } },
      alternateRowStyles: { fillColor: [248, 248, 252] },
    });
  }

  // Footer
  const ph = doc.internal.pageSize.getHeight();
  doc.setFillColor(...navy); doc.rect(0, ph - 16, w, 16, "F");
  doc.setTextColor(180, 180, 180); doc.setFontSize(7); doc.setFont("helvetica", "normal");
  doc.text(`Entry ID: ${log.id}`, 14, ph - 8);
  doc.text("Essist Capital LLC · CONFIDENTIAL — Authorized use only", w / 2, ph - 8, { align: "center" });
  doc.text(`Printed: ${new Date().toLocaleDateString()}`, w - 14, ph - 8, { align: "right" });

  doc.save(`essist-audit-${log.action_type}-${new Date(log.created_at).toISOString().slice(0, 10)}.pdf`);
};

const exportAuditCSV = (data: AuditEntry[]) => {
  const headers = ["Timestamp", "Admin", "Action", "Table", "Target ID", "Old Value", "New Value", "IP"];
  const rows = data.map(l => [
    new Date(l.created_at).toISOString(),
    l.admin_email || l.admin_user_id,
    l.action_type,
    l.target_table,
    l.target_id || "",
    l.old_value ? JSON.stringify(l.old_value) : "",
    l.new_value ? JSON.stringify(l.new_value) : "",
    l.ip_address || "",
  ]);
  const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  a.download = `audit_log_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
};

const AdminAuditLog = () => {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selected, setSelected] = useState<AuditEntry | null>(null);

  useEffect(() => { fetchLogs(); }, []);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      if (!error && data) setLogs(data as AuditEntry[]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = logs.filter((log) => {
    const matchesSearch =
      !search ||
      log.action_type.toLowerCase().includes(search.toLowerCase()) ||
      log.target_table.toLowerCase().includes(search.toLowerCase()) ||
      log.target_id?.toLowerCase().includes(search.toLowerCase()) ||
      log.admin_user_id?.toLowerCase().includes(search.toLowerCase());
    const matchesAction = actionFilter === "all" || log.action_type === actionFilter;
    const logDate = new Date(log.created_at);
    const matchesStart = !startDate || logDate >= new Date(startDate);
    const matchesEnd = !endDate || logDate <= new Date(endDate + "T23:59:59");
    return matchesSearch && matchesAction && matchesStart && matchesEnd;
  });

  const uniqueActions = Array.from(new Set(logs.map((l) => l.action_type)));

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0d1f1e] flex items-center justify-center">
            <Shield className="w-5 h-5 text-[#0d9488]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Audit Log</h1>
            <p className="text-muted-foreground text-sm">Read-only record of all admin actions — click any row for full detail</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => exportAuditPDF(filtered)}>
            <FileText className="w-4 h-4 mr-1.5" />PDF
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportAuditCSV(filtered)}>
            <Download className="w-4 h-4 mr-1.5" />CSV
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search by action, table, ID..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-48"><SelectValue placeholder="All actions" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {uniqueActions.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-40" />
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-40" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm">
              <Shield className="w-10 h-10 mx-auto mb-3 opacity-30" />
              No audit log entries found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    {["Timestamp","Admin","Action","Target","Changes",""].map(h => (
                      <th key={h} className="px-4 py-3 text-left font-semibold text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map((log) => {
                    const changed = diffKeys(log.old_value, log.new_value);
                    return (
                      <tr
                        key={log.id}
                        className="hover:bg-muted/40 cursor-pointer"
                        onClick={() => setSelected(log)}
                      >
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap text-xs">
                          {new Date(log.created_at).toLocaleString("en-US", {
                            month: "short", day: "numeric", year: "numeric",
                            hour: "numeric", minute: "2-digit", hour12: true,
                          })}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground max-w-[120px] truncate">
                          {log.admin_email || log.admin_user_id?.slice(0, 8) + "…"}
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={ACTION_COLORS[log.action_type] || "bg-gray-100 text-gray-800"}>
                            {log.action_type}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-medium">{log.target_table}</span>
                          <span className="text-muted-foreground ml-1 font-mono text-xs">
                            #{log.target_id?.slice(0, 8)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {changed.length > 0 ? (
                            <span className="font-mono">{changed.slice(0, 3).join(", ")}{changed.length > 3 ? ` +${changed.length - 3}` : ""}</span>
                          ) : log.new_value ? (
                            <span className="text-muted-foreground/50">new record</span>
                          ) : "—"}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">View →</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground text-center">
        Showing {filtered.length} of {logs.length} entries · Read-only · Cannot be edited or deleted
      </p>

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelected(null)} />
          <div className="relative bg-background rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div className="flex items-center gap-3">
                <Badge className={ACTION_COLORS[selected.action_type] || "bg-gray-100 text-gray-800"}>
                  {selected.action_type}
                </Badge>
                <span className="font-bold">{selected.target_table}</span>
                <span className="font-mono text-xs text-muted-foreground">#{selected.target_id?.slice(0, 12)}…</span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => exportSingleEntryPDF(selected)}>
                  <FileText className="w-4 h-4 mr-1.5" />Download PDF
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setSelected(null)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            <div className="overflow-y-auto p-6 space-y-5">
              {/* Metadata */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Timestamp</p>
                  <p>{new Date(selected.created_at).toLocaleString("en-US", { dateStyle: "full", timeStyle: "short" })}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Admin User</p>
                  <p className="font-mono text-xs break-all">{selected.admin_email || selected.admin_user_id}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Record ID</p>
                  <p className="font-mono text-xs break-all">{selected.target_id}</p>
                </div>
                {selected.ip_address && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">IP Address</p>
                    <p className="font-mono text-xs">{selected.ip_address}</p>
                  </div>
                )}
              </div>

              {/* Diff view */}
              {(selected.old_value || selected.new_value) && (() => {
                const changed = diffKeys(selected.old_value, selected.new_value);
                const allKeys = Array.from(new Set([
                  ...Object.keys(selected.old_value || {}),
                  ...Object.keys(selected.new_value || {}),
                ]));
                return (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
                      Field Changes {changed.length > 0 && `(${changed.length} changed)`}
                    </p>
                    <div className="rounded-xl border overflow-hidden text-xs font-mono">
                      <div className="grid grid-cols-[1fr_1fr_1fr] bg-muted text-muted-foreground">
                        <div className="px-3 py-2 font-bold">Field</div>
                        <div className="px-3 py-2 font-bold border-l">Before</div>
                        <div className="px-3 py-2 font-bold border-l">After</div>
                      </div>
                      {allKeys.map(key => {
                        const isChanged = changed.includes(key);
                        const oldV = selected.old_value?.[key];
                        const newV = selected.new_value?.[key];
                        return (
                          <div
                            key={key}
                            className={`grid grid-cols-[1fr_1fr_1fr] border-t ${isChanged ? "bg-yellow-50" : ""}`}
                          >
                            <div className={`px-3 py-2 ${isChanged ? "font-bold text-yellow-800" : "text-muted-foreground"}`}>
                              {key}
                            </div>
                            <div className={`px-3 py-2 border-l break-all ${isChanged ? "bg-red-50 text-red-700 line-through" : "text-muted-foreground"}`}>
                              {oldV === undefined ? <span className="opacity-30">—</span> : JSON.stringify(oldV)}
                            </div>
                            <div className={`px-3 py-2 border-l break-all ${isChanged ? "bg-green-50 text-green-700 font-semibold" : "text-muted-foreground"}`}>
                              {newV === undefined ? <span className="opacity-30">—</span> : JSON.stringify(newV)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Raw JSON */}
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Raw JSON Record</p>
                <pre className="text-xs bg-muted rounded-xl p-4 overflow-x-auto leading-relaxed whitespace-pre-wrap break-all">
                  {JSON.stringify(selected, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAuditLog;
