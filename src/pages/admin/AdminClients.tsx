import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/calculations";
import { Search, Download, Loader2, Users, X, CreditCard, FileText, Phone, Mail } from "lucide-react";

interface ClientRow {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  borrower_type: string | null;
  loan_count: number;
  total_funded: number;
  latest_status: string | null;
  applications: AppRow[];
  card: CardRow | null;
}

interface AppRow {
  id: string;
  loan_amount: number;
  term_months: number;
  status: string;
  project_type: string;
  property_city: string;
  property_state: string;
  created_at: string;
}

interface CardRow {
  id: string;
  card_last_four: string;
  credit_limit: number;
  available_balance: number;
  drawn_amount: number;
  card_status: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  under_review: "bg-blue-100 text-blue-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  funded: "bg-primary/10 text-primary",
  active: "bg-primary/10 text-primary",
  closed: "bg-muted text-muted-foreground",
};

const exportCSV = (data: ClientRow[]) => {
  const headers = ["Name","Email","Phone","Borrower Type","Loan Count","Total Funded","Status"];
  const rows = data.map(c => [
    `${c.first_name||""} ${c.last_name||""}`.trim(),
    c.email||"", c.phone||"", c.borrower_type||"individual", c.loan_count, c.total_funded, c.latest_status||"",
  ]);
  const csv = [headers,...rows].map(r=>r.map(v=>`"${v}"`).join(",")).join("\n");
  const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv],{type:"text/csv"})); a.download = "clients.csv"; a.click();
};

const AdminClients = () => {
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selected, setSelected] = useState<ClientRow | null>(null);

  useEffect(() => { fetchClients(); }, []);

  const fetchClients = async () => {
    setIsLoading(true);

    const [profilesRes, appsRes, cardsRes] = await Promise.all([
      supabase.from("profiles").select("user_id, first_name, last_name, email, phone, borrower_type"),
      supabase.from("applications").select("id, user_id, loan_amount, term_months, status, project_type, property_city, property_state, created_at").order("created_at", { ascending: false }),
      supabase.from("virtual_cards").select("id, user_id, card_last_four, credit_limit, available_balance, drawn_amount, card_status"),
    ]);

    const cardMap: Record<string, CardRow> = {};
    for (const c of cardsRes.data || []) cardMap[c.user_id] = c as CardRow;

    const appsByUser: Record<string, AppRow[]> = {};
    for (const a of appsRes.data || []) {
      if (!appsByUser[a.user_id]) appsByUser[a.user_id] = [];
      appsByUser[a.user_id].push(a as AppRow);
    }

    const clientMap: Record<string, ClientRow> = {};
    for (const p of profilesRes.data || []) {
      clientMap[p.user_id] = {
        user_id: p.user_id,
        first_name: p.first_name,
        last_name: p.last_name,
        email: p.email,
        phone: p.phone,
        borrower_type: p.borrower_type,
        loan_count: 0,
        total_funded: 0,
        latest_status: null,
        applications: appsByUser[p.user_id] || [],
        card: cardMap[p.user_id] || null,
      };
    }

    // Also include applicants who have no profile row (trigger may have failed)
    for (const a of appsRes.data || []) {
      if (!clientMap[a.user_id]) {
        clientMap[a.user_id] = {
          user_id: a.user_id,
          first_name: null,
          last_name: null,
          email: null,
          phone: null,
          borrower_type: null,
          loan_count: 0,
          total_funded: 0,
          latest_status: null,
          applications: appsByUser[a.user_id] || [],
          card: cardMap[a.user_id] || null,
        };
      }
    }

    for (const a of appsRes.data || []) {
      if (!clientMap[a.user_id]) continue;
      clientMap[a.user_id].loan_count++;
      if (["funded","active"].includes(a.status)) clientMap[a.user_id].total_funded += Number(a.loan_amount);
      clientMap[a.user_id].latest_status = a.status;
    }

    setClients(Object.values(clientMap));
    setIsLoading(false);
  };

  const filtered = clients.filter(c => {
    const name = `${c.first_name||""} ${c.last_name||""} ${c.email||""}`.toLowerCase();
    return (!search || name.includes(search.toLowerCase())) &&
      (typeFilter === "all" || c.borrower_type === typeFilter);
  });

  return (
    <div className="space-y-5 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#0d1f1e]">Clients</h1>
          <p className="text-xs text-gray-400 mt-0.5">{filtered.length} borrowers · click to view details</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => exportCSV(filtered)}>
          <Download className="w-4 h-4 mr-1.5" />Export
        </Button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
          <Input className="pl-9 w-60 bg-white border-gray-200" placeholder="Search name or email..." value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40 bg-white border-gray-200"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="individual">Individual</SelectItem>
            <SelectItem value="llc">LLC / Business</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-[#0d1f1e]" /></div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">
            <Users className="w-8 h-8 mx-auto mb-3 opacity-30" />No clients found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {["Name","Email","Phone","Type","Loans","Funded","Status",""].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(c => (
                  <tr key={c.user_id} className="hover:bg-gray-50/70 cursor-pointer transition-colors" onClick={() => setSelected(c)}>
                    <td className="px-5 py-3.5 font-semibold text-[#0d1f1e]">
                      {(`${c.first_name||""} ${c.last_name||""}`.trim()) || (c.email?.trim() || null) || c.user_id.slice(0,8) + "…"}
                    </td>
                    <td className="px-5 py-3.5 text-gray-400">{c.email}</td>
                    <td className="px-5 py-3.5 text-gray-400">{c.phone || "—"}</td>
                    <td className="px-5 py-3.5">
                      <Badge className={c.borrower_type === "llc" ? "bg-purple-100 text-purple-800 text-xs" : "bg-blue-100 text-blue-800 text-xs"}>
                        {c.borrower_type || "individual"}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">{c.loan_count}</td>
                    <td className="px-5 py-3.5 font-bold text-[#0d1f1e]">{formatCurrency(c.total_funded)}</td>
                    <td className="px-5 py-3.5">
                      {c.latest_status ? (
                        <Badge className={STATUS_COLORS[c.latest_status] + " text-xs"}>
                          {c.latest_status.replace(/_/g," ")}
                        </Badge>
                      ) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-5 py-3.5 text-gray-300 text-xs">View →</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Client Detail Panel */}
      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSelected(null)} />
          <div className="relative w-full max-w-xl bg-white shadow-2xl overflow-y-auto flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-background z-10">
              <h2 className="font-bold text-lg">
                {(`${selected.first_name||""} ${selected.last_name||""}`.trim()) || selected.email || selected.user_id.slice(0,8) + "…"}
              </h2>
              <Button variant="ghost" size="icon" onClick={() => setSelected(null)}><X className="w-5 h-5" /></Button>
            </div>

            <div className="p-6 space-y-6">
              {/* Contact info */}
              <section>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Contact</p>
                <div className="bg-muted rounded-xl p-4 space-y-2 text-sm">
                  <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-muted-foreground" />{selected.email || "—"}</div>
                  <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-muted-foreground" />{selected.phone || "—"}</div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="capitalize">{selected.borrower_type || "individual"}</span>
                  </div>
                </div>
              </section>

              {/* Virtual card */}
              {selected.card && (
                <section>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Virtual Card</p>
                  <div className="bg-[#0d1f1e] rounded-xl p-4 text-white text-sm space-y-2">
                    <div className="flex justify-between">
                      <span className="text-white/60">Card</span>
                      <span className="font-mono">••••{selected.card.card_last_four}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Credit Limit</span>
                      <span className="font-semibold text-[#0d9488]">{formatCurrency(selected.card.credit_limit)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Drawn</span>
                      <span>{formatCurrency(selected.card.drawn_amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Available</span>
                      <span>{formatCurrency(selected.card.available_balance)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Status</span>
                      <Badge className={selected.card.card_status === "active" ? "bg-green-500/20 text-green-300" : "bg-amber-500/20 text-amber-300"}>
                        {selected.card.card_status}
                      </Badge>
                    </div>
                  </div>
                </section>
              )}

              {/* Applications */}
              <section>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
                  Applications ({selected.applications.length})
                </p>
                {selected.applications.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No applications yet</p>
                ) : (
                  <div className="space-y-3">
                    {selected.applications.map(app => (
                      <div key={app.id} className="border rounded-xl p-4 text-sm">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-semibold capitalize">{app.project_type} · {app.property_city}, {app.property_state}</p>
                            <p className="text-muted-foreground text-xs mt-0.5">{new Date(app.created_at).toLocaleDateString()}</p>
                          </div>
                          <Badge className={STATUS_COLORS[app.status] || ""}>
                            {app.status.replace(/_/g," ")}
                          </Badge>
                        </div>
                        <div className="flex gap-6 text-muted-foreground">
                          <span><span className="font-semibold text-foreground">{formatCurrency(app.loan_amount)}</span> loan</span>
                          <span><span className="font-semibold text-foreground">{app.term_months}</span> months</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 font-mono">ID: {app.id.slice(0,12)}…</p>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminClients;
