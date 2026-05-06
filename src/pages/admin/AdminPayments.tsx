import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/calculations";
import { DollarSign, Download, Loader2, Search, CheckCircle2 } from "lucide-react";

interface PaymentRow {
  id: string;
  application_id: string;
  user_id: string;
  payment_number: number;
  due_date: string;
  amount_due: number;
  amount_paid: number | null;
  status: string;
  paid_at: string | null;
  profiles?: { first_name: string; last_name: string } | null;
}

const STATUS_BADGE: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-800",
  paid: "bg-green-100 text-green-800",
  late: "bg-red-100 text-red-600",
  missed: "bg-red-200 text-red-900",
};

const exportCSV = (data: PaymentRow[]) => {
  const headers = ["Borrower","Payment #","Due Date","Amount Due","Amount Paid","Status","Paid At"];
  const rows = data.map(p => [
    `${p.profiles?.first_name||""} ${p.profiles?.last_name||""}`.trim(),
    p.payment_number, p.due_date, p.amount_due, p.amount_paid || "", p.status, p.paid_at || "",
  ]);
  const csv = [headers,...rows].map(r=>r.map(v=>`"${v}"`).join(",")).join("\n");
  const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv],{type:"text/csv"})); a.download = "payments.csv"; a.click();
};

const AdminPayments = () => {
  const { toast } = useToast();
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [markingId, setMarkingId] = useState<string | null>(null);

  useEffect(() => { fetchPayments(); }, []);

  const fetchPayments = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("payments")
      .select("*, profiles(first_name, last_name)")
      .order("due_date", { ascending: true });
    if (!error) setPayments((data as PaymentRow[]) || []);
    setIsLoading(false);
  };

  const markPaid = async (payment: PaymentRow) => {
    setMarkingId(payment.id);
    const { error } = await supabase.from("payments").update({
      status: "paid", amount_paid: payment.amount_due, paid_at: new Date().toISOString(),
    }).eq("id", payment.id);
    if (!error) { toast({ title: `Payment #${payment.payment_number} marked as paid` }); fetchPayments(); }
    else toast({ title: "Failed to update payment", variant: "destructive" });
    setMarkingId(null);
  };

  const filtered = payments.filter(p => {
    const nameMatch = !search || `${p.profiles?.first_name||""} ${p.profiles?.last_name||""}`.toLowerCase().includes(search.toLowerCase());
    const statusMatch = statusFilter === "all" || p.status === statusFilter;
    return nameMatch && statusMatch;
  });

  const now = new Date();
  const totalDueThisMonth = payments.filter(p => {
    const d = new Date(p.due_date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).reduce((s, p) => s + p.amount_due, 0);

  const totalCollectedThisMonth = payments.filter(p => {
    if (p.status !== "paid" || !p.paid_at) return false;
    const d = new Date(p.paid_at);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).reduce((s, p) => s + (p.amount_paid || p.amount_due), 0);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Payments</h1>
          <p className="text-sm text-muted-foreground">Track and manage all loan payments</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => exportCSV(filtered)}>
          <Download className="w-4 h-4 mr-2" />Export CSV
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Expected This Month</p>
              <p className="text-2xl font-bold text-amber-600">{formatCurrency(totalDueThisMonth)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Collected This Month</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(totalCollectedThisMonth)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9 w-60" placeholder="Search borrower..." value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="late">Late</SelectItem>
            <SelectItem value="missed">Missed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm">No payments found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>{["Borrower","#","Due Date","Amount Due","Amount Paid","Status","Action"].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-semibold text-muted-foreground">{h}</th>
                  ))}</tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map(p => (
                    <tr key={p.id} className="hover:bg-muted/40">
                      <td className="px-4 py-3 font-medium">{p.profiles?.first_name} {p.profiles?.last_name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{p.payment_number}</td>
                      <td className="px-4 py-3">{new Date(p.due_date).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</td>
                      <td className="px-4 py-3">{formatCurrency(p.amount_due)}</td>
                      <td className="px-4 py-3">{p.amount_paid ? formatCurrency(p.amount_paid) : "—"}</td>
                      <td className="px-4 py-3"><Badge className={STATUS_BADGE[p.status]}>{p.status}</Badge></td>
                      <td className="px-4 py-3">
                        {p.status !== "paid" ? (
                          <Button size="sm" variant="outline" className="text-green-700 border-green-300 hover:bg-green-50"
                            onClick={() => markPaid(p)} disabled={markingId === p.id}>
                            {markingId === p.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3 mr-1" />}
                            Mark Paid
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">{p.paid_at ? new Date(p.paid_at).toLocaleDateString() : "—"}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPayments;
