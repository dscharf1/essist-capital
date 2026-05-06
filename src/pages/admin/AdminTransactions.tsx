import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/calculations";
import { Upload, Plus, Loader2, Trash2, FileText } from "lucide-react";

interface VirtualCard {
  id: string;
  card_last_four: string;
  credit_limit: number;
  drawn_amount: number;
  card_status: string;
  application_id: string;
  profile?: { first_name: string; last_name: string; email: string } | null;
}

interface TxRow {
  transaction_date: string;
  merchant_name: string;
  amount: string;
  category: string;
  notes: string;
}

const BLANK_ROW = (): TxRow => ({
  transaction_date: new Date().toISOString().split("T")[0],
  merchant_name: "",
  amount: "",
  category: "",
  notes: "",
});

const AdminTransactions = () => {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [cards, setCards] = useState<VirtualCard[]>([]);
  const [selectedCardId, setSelectedCardId] = useState("");
  const [rows, setRows] = useState<TxRow[]>([BLANK_ROW()]);
  const [saving, setSaving] = useState(false);
  const [csvParsed, setCsvParsed] = useState(false);

  // Recent transactions for selected card
  const [recentTx, setRecentTx] = useState<Record<string, unknown>[]>([]);
  const [loadingTx, setLoadingTx] = useState(false);

  useEffect(() => { fetchCards(); }, []);
  useEffect(() => { if (selectedCardId) fetchRecentTx(selectedCardId); }, [selectedCardId]);

  const fetchCards = async () => {
    const { data: cardData } = await supabase
      .from("virtual_cards")
      .select("id, card_last_four, credit_limit, drawn_amount, card_status, application_id, user_id")
      .order("issued_at", { ascending: false });

    if (!cardData) return;

    const userIds = [...new Set(cardData.map((c) => c.user_id))];
    const { data: profileData } = await supabase
      .from("profiles")
      .select("user_id, first_name, last_name, email")
      .in("user_id", userIds);

    const profileMap = Object.fromEntries((profileData || []).map((p) => [p.user_id, p]));
    setCards(cardData.map((c) => ({ ...c, profile: profileMap[(c as Record<string, string>).user_id] || null })));
  };

  const fetchRecentTx = async (cardId: string) => {
    setLoadingTx(true);
    const { data } = await supabase
      .from("card_transactions")
      .select("*")
      .eq("virtual_card_id", cardId)
      .order("transaction_date", { ascending: false })
      .limit(50);
    setRecentTx((data as Record<string, unknown>[]) || []);
    setLoadingTx(false);
  };

  const handleCSV = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split("\n").filter((l) => l.trim());
      if (lines.length < 2) { toast({ title: "CSV is empty", variant: "destructive" }); return; }

      // Expect header: date, merchant, amount, category, notes (case insensitive)
      const parsed: TxRow[] = lines.slice(1).map((line) => {
        const cols = line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
        return {
          transaction_date: cols[0] || new Date().toISOString().split("T")[0],
          merchant_name: cols[1] || "",
          amount: cols[2] || "",
          category: cols[3] || "",
          notes: cols[4] || "",
        };
      }).filter((r) => r.merchant_name || r.amount);

      setRows(parsed);
      setCsvParsed(true);
      toast({ title: `${parsed.length} rows parsed from CSV` });
    };
    reader.readAsText(file);
  };

  const updateRow = (idx: number, field: keyof TxRow, value: string) => {
    setRows((prev) => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r));
  };

  const addRow = () => setRows((prev) => [...prev, BLANK_ROW()]);
  const removeRow = (idx: number) => setRows((prev) => prev.filter((_, i) => i !== idx));

  const saveTransactions = async () => {
    if (!selectedCardId) { toast({ title: "Select a card first", variant: "destructive" }); return; }

    const card = cards.find((c) => c.id === selectedCardId);
    if (!card) return;

    const valid = rows.filter((r) => r.merchant_name && r.amount && parseFloat(r.amount) > 0);
    if (!valid.length) { toast({ title: "No valid rows to save", variant: "destructive" }); return; }

    setSaving(true);
    try {
      // Get application and user_id
      const { data: appData } = await supabase
        .from("applications")
        .select("user_id")
        .eq("id", card.application_id)
        .single();

      if (!appData) throw new Error("Application not found");

      const inserts = valid.map((r) => ({
        virtual_card_id: selectedCardId,
        application_id: card.application_id,
        user_id: appData.user_id,
        transaction_date: r.transaction_date,
        merchant_name: r.merchant_name,
        amount: parseFloat(r.amount),
        category: r.category || null,
        notes: r.notes || null,
      }));

      const { error } = await supabase.from("card_transactions").insert(inserts);
      if (error) throw error;

      // Update drawn_amount on the card
      const totalAdded = valid.reduce((sum, r) => sum + parseFloat(r.amount), 0);
      const newDrawn = Math.min(card.drawn_amount + totalAdded, card.credit_limit);
      await supabase.from("virtual_cards")
        .update({ drawn_amount: newDrawn, available_balance: Math.max(0, card.credit_limit - newDrawn) })
        .eq("id", selectedCardId);

      toast({ title: `${valid.length} transaction${valid.length > 1 ? "s" : ""} uploaded`, description: "Client dashboard updated." });
      setRows([BLANK_ROW()]);
      setCsvParsed(false);
      fetchRecentTx(selectedCardId);
      fetchCards();
    } catch (err) {
      console.error(err);
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const selectedCard = cards.find((c) => c.id === selectedCardId);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Transaction Upload</h1>
        <p className="text-sm text-muted-foreground">Manually upload Baselane transaction history for a client card</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left: Upload Form */}
        <div className="space-y-5">
          {/* Card Selector */}
          <Card>
            <CardHeader><CardTitle className="text-base">1. Select Client Card</CardTitle></CardHeader>
            <CardContent>
              <Select value={selectedCardId} onValueChange={setSelectedCardId}>
                <SelectTrigger><SelectValue placeholder="Choose a virtual card…" /></SelectTrigger>
                <SelectContent>
                  {cards.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      <span className="font-mono">••••{c.card_last_four}</span>
                      <span className="ml-2 text-muted-foreground">
                        — {c.profile?.first_name} {c.profile?.last_name} ({formatCurrency(c.credit_limit)})
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedCard && (
                <div className="mt-3 p-3 bg-muted rounded-xl text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Credit Limit</span>
                    <span className="font-medium">{formatCurrency(selectedCard.credit_limit)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Drawn</span>
                    <span className="font-medium">{formatCurrency(selectedCard.drawn_amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Available</span>
                    <span className="font-medium text-green-600">{formatCurrency(selectedCard.credit_limit - selectedCard.drawn_amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <Badge className={selectedCard.card_status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"}>
                      {selectedCard.card_status}
                    </Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* CSV Upload or Manual Entry */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">2. Add Transactions</CardTitle>
                <div className="flex gap-2">
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCSV(f); e.target.value = ""; }}
                  />
                  <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                    <Upload className="w-3.5 h-3.5 mr-1.5" />
                    Import CSV
                  </Button>
                  <Button variant="outline" size="sm" onClick={addRow}>
                    <Plus className="w-3.5 h-3.5 mr-1.5" />
                    Add Row
                  </Button>
                </div>
              </div>
              {csvParsed && (
                <p className="text-xs text-muted-foreground mt-1">
                  CSV imported — review rows below before saving.
                  Expected columns: <code>date, merchant, amount, category, notes</code>
                </p>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              {rows.map((row, idx) => (
                <div key={idx} className="border rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground">Row {idx + 1}</span>
                    {rows.length > 1 && (
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeRow(idx)}>
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Date *</Label>
                      <Input type="date" className="mt-0.5 h-8 text-sm" value={row.transaction_date} onChange={(e) => updateRow(idx, "transaction_date", e.target.value)} />
                    </div>
                    <div>
                      <Label className="text-xs">Amount ($) *</Label>
                      <Input type="number" step="0.01" min="0" className="mt-0.5 h-8 text-sm" value={row.amount} onChange={(e) => updateRow(idx, "amount", e.target.value)} placeholder="1500.00" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Merchant Name *</Label>
                    <Input className="mt-0.5 h-8 text-sm" value={row.merchant_name} onChange={(e) => updateRow(idx, "merchant_name", e.target.value)} placeholder="Home Depot" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Category</Label>
                      <Input className="mt-0.5 h-8 text-sm" value={row.category} onChange={(e) => updateRow(idx, "category", e.target.value)} placeholder="Materials" />
                    </div>
                    <div>
                      <Label className="text-xs">Notes</Label>
                      <Input className="mt-0.5 h-8 text-sm" value={row.notes} onChange={(e) => updateRow(idx, "notes", e.target.value)} placeholder="Optional" />
                    </div>
                  </div>
                </div>
              ))}

              <Button
                className="w-full bg-[#0d1f1e] text-white hover:bg-[#1a3330]"
                onClick={saveTransactions}
                disabled={saving || !selectedCardId}
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                Upload {rows.filter((r) => r.merchant_name && r.amount).length} Transaction{rows.filter((r) => r.merchant_name && r.amount).length !== 1 ? "s" : ""} to Client
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right: Recent Transactions */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-4 h-4" />
                {selectedCard
                  ? `Transaction History — ••••${selectedCard.card_last_four}`
                  : "Transaction History"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {!selectedCardId ? (
                <div className="py-12 text-center text-muted-foreground text-sm">Select a card to view history</div>
              ) : loadingTx ? (
                <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin" /></div>
              ) : recentTx.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground text-sm">No transactions yet</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">Date</th>
                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">Merchant</th>
                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">Category</th>
                        <th className="px-4 py-2.5 text-right text-xs font-semibold text-muted-foreground">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {recentTx.map((tx) => (
                        <tr key={tx.id as string} className="hover:bg-muted/40">
                          <td className="px-4 py-2.5 text-muted-foreground">{new Date(tx.transaction_date as string).toLocaleDateString()}</td>
                          <td className="px-4 py-2.5 font-medium">{tx.merchant_name as string}</td>
                          <td className="px-4 py-2.5 text-muted-foreground">{(tx.category as string) || "—"}</td>
                          <td className="px-4 py-2.5 text-right font-semibold">{formatCurrency(tx.amount as number)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminTransactions;
