import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { email as emailLib } from "@/lib/email";
import { formatCurrency, calculateInterestOnlyPayment, calculateMonthlyPayment } from "@/lib/calculations";
import { CreditCard, Plus, Snowflake, Download, Loader2, X, PlayCircle } from "lucide-react";
import type { VirtualCard, CardTransaction } from "@/types/database";

interface ApplicationRow { id: string; user_id: string; loan_amount: number; term_months: number; }
interface CardWithProfile extends VirtualCard {
  profiles?: { first_name: string; last_name: string } | null;
  applications?: ApplicationRow | null;
}

const STATUS_BADGE: Record<string, string> = {
  inactive: "bg-gray-100 text-gray-700",
  active: "bg-green-100 text-green-800",
  frozen: "bg-amber-100 text-amber-800",
  closed: "bg-red-100 text-red-800",
};

const PHASE_BADGE: Record<string, string> = {
  draw_period: "bg-blue-100 text-blue-800",
  repayment: "bg-purple-100 text-purple-800",
};

const exportCSV = (cards: CardWithProfile[]) => {
  const headers = ["Borrower","Last Four","Phase","Credit Limit","Drawn","Available","Status"];
  const rows = cards.map(c => [
    `${c.profiles?.first_name||""} ${c.profiles?.last_name||""}`.trim(),
    c.card_last_four, c.payment_phase || "draw_period",
    c.credit_limit, c.drawn_amount, c.available_balance, c.card_status,
  ]);
  const csv = [headers,...rows].map(r=>r.map(v=>`"${v}"`).join(",")).join("\n");
  const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv],{type:"text/csv"})); a.download = "cards.csv"; a.click();
};

const AdminCards = () => {
  const { toast } = useToast();
  const [cards, setCards] = useState<CardWithProfile[]>([]);
  const [applications, setApplications] = useState<ApplicationRow[]>([]);
  const [transactions, setTransactions] = useState<CardTransaction[]>([]);
  const [selectedCard, setSelectedCard] = useState<CardWithProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showIssueDialog, setShowIssueDialog] = useState(false);
  const [showTxDialog, setShowTxDialog] = useState(false);
  const [saving, setSaving] = useState(false);

  const [issueForm, setIssueForm] = useState({
    application_id: "", card_number: "", card_last_four: "", card_expiry_month: "",
    card_expiry_year: "", card_cvv: "", credit_limit: "", billing_zip: "", baselane_account_name: "",
  });
  const [txForm, setTxForm] = useState({
    transaction_date: "", merchant_name: "", amount: "", category: "", notes: "",
  });

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setIsLoading(true);
    const [cardsRes, appsRes] = await Promise.all([
      supabase.from("virtual_cards")
        .select("*, applications(id, user_id, loan_amount, term_months)")
        .order("issued_at", { ascending: false }),
      supabase.from("applications").select("id, user_id, loan_amount, term_months"),
    ]);

    const rawCards = (cardsRes.data || []) as (VirtualCard & { applications?: ApplicationRow | null })[];

    // Fetch profiles separately — no direct FK from virtual_cards to profiles
    const userIds = [...new Set(rawCards.map(c => c.user_id).filter(Boolean))];
    const { data: profileData } = userIds.length
      ? await supabase.from("profiles").select("user_id, first_name, last_name").in("user_id", userIds)
      : { data: [] };
    const profileMap = Object.fromEntries((profileData || []).map(p => [p.user_id, p]));

    const merged: CardWithProfile[] = rawCards.map(c => ({
      ...c,
      profiles: profileMap[c.user_id] || null,
    }));

    setCards(merged);
    setApplications((appsRes.data as ApplicationRow[]) || []);
    setIsLoading(false);
  };

  const issueCard = async () => {
    setSaving(true);
    try {
      const app = applications.find(a => a.id === issueForm.application_id);
      if (!app) throw new Error("Application not found");
      const limit = parseFloat(issueForm.credit_limit);
      // Auto-derive last four from full card number if provided
      const lastFour = issueForm.card_number
        ? issueForm.card_number.replace(/\s/g, "").slice(-4)
        : issueForm.card_last_four;

      const { error } = await supabase.from("virtual_cards").insert({
        application_id: issueForm.application_id,
        user_id: app.user_id,
        card_number: issueForm.card_number.replace(/\s/g, "") || null,
        card_last_four: lastFour,
        card_expiry_month: parseInt(issueForm.card_expiry_month),
        card_expiry_year: parseInt(issueForm.card_expiry_year),
        card_cvv: issueForm.card_cvv || null,
        credit_limit: limit,
        available_balance: limit,
        drawn_amount: 0,
        card_status: "active",
        payment_phase: "draw_period",
        baselane_account_name: issueForm.baselane_account_name || null,
        billing_zip: issueForm.billing_zip || null,
      });
      if (error) throw error;
      await supabase.from("applications").update({ status: "funded" }).eq("id", issueForm.application_id);
      try { await emailLib.onCardIssued(issueForm.application_id); } catch (_) {}
      toast({ title: "Card issued — borrower is now in draw period (interest-only)" });
      setShowIssueDialog(false);
      setIssueForm({ application_id:"", card_number:"", card_last_four:"", card_expiry_month:"", card_expiry_year:"", card_cvv:"", credit_limit:"", billing_zip:"", baselane_account_name:"" });
      fetchAll();
    } catch (err: unknown) {
      toast({ title: (err as Error).message || "Failed to issue card", variant: "destructive" });
    } finally { setSaving(false); }
  };

  const startRepayment = async (card: CardWithProfile) => {
    const { error } = await supabase.from("virtual_cards").update({
      payment_phase: "repayment",
      repayment_started_at: new Date().toISOString(),
    }).eq("id", card.id);
    if (!error) {
      toast({ title: "Repayment phase started", description: "Full P+I payments now active for this borrower." });
      fetchAll();
    } else {
      toast({ title: "Failed to start repayment", variant: "destructive" });
    }
  };

  const updateCardStatus = async (cardId: string, status: string) => {
    const { error } = await supabase.from("virtual_cards").update({ card_status: status }).eq("id", cardId);
    if (!error) { toast({ title: `Card ${status}` }); fetchAll(); }
  };

  const addTransaction = async () => {
    if (!selectedCard) return;
    setSaving(true);
    try {
      const amount = parseFloat(txForm.amount);
      const { error } = await supabase.from("card_transactions").insert({
        virtual_card_id: selectedCard.id,
        application_id: selectedCard.application_id,
        user_id: selectedCard.user_id,
        transaction_date: txForm.transaction_date,
        merchant_name: txForm.merchant_name,
        amount,
        category: txForm.category || null,
        notes: txForm.notes || null,
      });
      if (error) throw error;

      const newDrawn = selectedCard.drawn_amount + amount;
      const newAvailable = Math.max(0, selectedCard.available_balance - amount);
      const updates: Record<string, unknown> = { drawn_amount: newDrawn, available_balance: newAvailable };

      // Auto-trigger repayment when fully drawn
      if (newDrawn >= selectedCard.credit_limit && selectedCard.payment_phase === "draw_period") {
        updates.payment_phase = "repayment";
        updates.repayment_started_at = new Date().toISOString();
        toast({ title: "Card fully drawn — repayment phase started automatically" });
      }

      await supabase.from("virtual_cards").update(updates).eq("id", selectedCard.id);
      setShowTxDialog(false);
      setTxForm({ transaction_date:"", merchant_name:"", amount:"", category:"", notes:"" });
      fetchAll();
    } catch { toast({ title: "Failed to add transaction", variant: "destructive" }); }
    finally { setSaving(false); }
  };

  const viewTransactions = async (card: CardWithProfile) => {
    setSelectedCard(card);
    const { data } = await supabase.from("card_transactions").select("*").eq("virtual_card_id", card.id).order("transaction_date", { ascending: false });
    setTransactions((data as CardTransaction[]) || []);
    setShowTxDialog(true);
  };

  const getMonthlyPayment = (card: CardWithProfile) => {
    const app = card.applications;
    if (!app) return null;
    const phase = card.payment_phase || "draw_period";
    if (phase === "draw_period") return calculateInterestOnlyPayment(app.loan_amount, app.term_months);
    return calculateMonthlyPayment(app.loan_amount, app.term_months);
  };

  return (
    <div className="space-y-5 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#0d1f1e]">Virtual Cards</h1>
          <p className="text-xs text-gray-400 mt-0.5">Manage issued cards and payment phases</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => exportCSV(cards)}>
            <Download className="w-4 h-4 mr-2" />Export CSV
          </Button>
          <Button size="sm" className="bg-[#0d1f1e] text-white hover:bg-[#1a3330]" onClick={() => setShowIssueDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />Issue Card
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-[#0d1f1e]" /></div>
          ) : cards.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-sm">
              <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-30" />No cards issued yet
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">{["Borrower","Last Four","Phase","Monthly Due","Drawn / Limit","Available","Status","Actions"].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-400">{h}</th>
                  ))}</tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {cards.map(card => {
                    const phase = card.payment_phase || "draw_period";
                    const monthly = getMonthlyPayment(card);
                    const drawnPct = card.credit_limit > 0 ? (card.drawn_amount / card.credit_limit) * 100 : 0;
                    return (
                      <tr key={card.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="px-5 py-3.5 font-semibold text-[#0d1f1e]">{card.profiles?.first_name} {card.profiles?.last_name}</td>
                        <td className="px-5 py-3.5 font-mono text-gray-500">•••• {card.card_last_four}</td>
                        <td className="px-5 py-3.5">
                          <div className="space-y-1">
                            <Badge className={PHASE_BADGE[phase]}>
                              {phase === "draw_period" ? "Draw Period" : "Repayment"}
                            </Badge>
                            {phase === "draw_period" && (
                              <div className="text-xs text-gray-400">{drawnPct.toFixed(0)}% drawn</div>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          {monthly !== null ? (
                            <div>
                              <div className="font-semibold text-[#0d1f1e]">{formatCurrency(monthly)}</div>
                              <div className="text-xs text-gray-400">
                                {phase === "draw_period" ? "Interest only" : "P+I"}
                              </div>
                            </div>
                          ) : "—"}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="font-medium text-[#0d1f1e]">{formatCurrency(card.drawn_amount)}</div>
                          <div className="text-xs text-gray-400">of {formatCurrency(card.credit_limit)}</div>
                        </td>
                        <td className="px-5 py-3.5 font-bold text-emerald-600">{formatCurrency(card.available_balance)}</td>
                        <td className="px-5 py-3.5"><Badge className={STATUS_BADGE[card.card_status] + " text-xs"}>{card.card_status}</Badge></td>
                        <td className="px-5 py-3.5">
                          <div className="flex gap-1 flex-wrap">
                            {/* Start Repayment — show in draw_period only */}
                            {phase === "draw_period" && card.card_status === "active" && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-purple-700 border-purple-300 hover:bg-purple-50"
                                onClick={() => startRepayment(card)}
                              >
                                <PlayCircle className="w-3 h-3 mr-1" />Start Repayment
                              </Button>
                            )}
                            <Button variant="ghost" size="sm" onClick={() => updateCardStatus(card.id, card.card_status === "frozen" ? "active" : "frozen")}>
                              <Snowflake className="w-3 h-3 mr-1" />{card.card_status === "frozen" ? "Unfreeze" : "Freeze"}
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => viewTransactions(card)}>Transactions</Button>
                            {card.card_status !== "closed" && (
                              <Button variant="ghost" size="sm" className="text-red-500" onClick={() => updateCardStatus(card.id, "closed")}>
                                <X className="w-3 h-3 mr-1" />Close
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
      </div>

      {/* Issue Card Dialog */}
      <Dialog open={showIssueDialog} onOpenChange={setShowIssueDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Issue Virtual Card</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground -mt-2">Card starts in draw period — borrower pays interest only until fully drawn.</p>
          <div className="space-y-4">
            <div>
              <Label>Application</Label>
              <Select value={issueForm.application_id} onValueChange={v => setIssueForm(p=>({...p,application_id:v}))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select approved application" /></SelectTrigger>
                <SelectContent>
                  {applications.map(a => (
                    <SelectItem key={a.id} value={a.id}>
                      App {a.id.slice(0,8)} — {formatCurrency(a.loan_amount)} / {a.term_months}mo
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Full Card Number (from Baselane)</Label>
              <Input className="mt-1 font-mono tracking-widest" maxLength={19} value={issueForm.card_number}
                onChange={e => {
                  // Auto-format with spaces every 4 digits
                  const raw = e.target.value.replace(/\D/g, "").slice(0, 16);
                  const formatted = raw.match(/.{1,4}/g)?.join(" ") || raw;
                  setIssueForm(p=>({...p, card_number: formatted, card_last_four: raw.slice(-4)}));
                }}
                placeholder="1234 5678 9012 3456" />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Expiry Month</Label>
                <Input className="mt-1" type="number" min="1" max="12" value={issueForm.card_expiry_month}
                  onChange={e=>setIssueForm(p=>({...p,card_expiry_month:e.target.value}))} placeholder="12" />
              </div>
              <div>
                <Label>Expiry Year</Label>
                <Input className="mt-1" type="number" min="2025" value={issueForm.card_expiry_year}
                  onChange={e=>setIssueForm(p=>({...p,card_expiry_year:e.target.value}))} placeholder="2027" />
              </div>
              <div>
                <Label>CVV</Label>
                <Input className="mt-1 font-mono" maxLength={4} value={issueForm.card_cvv}
                  onChange={e=>setIssueForm(p=>({...p,card_cvv:e.target.value}))} placeholder="123" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Credit Limit ($)</Label>
                <Input className="mt-1" type="number" value={issueForm.credit_limit}
                  onChange={e=>setIssueForm(p=>({...p,credit_limit:e.target.value}))} />
              </div>
              <div>
                <Label>Billing ZIP</Label>
                <Input className="mt-1" maxLength={5} value={issueForm.billing_zip}
                  onChange={e=>setIssueForm(p=>({...p,billing_zip:e.target.value}))} placeholder="07001" />
              </div>
            </div>

            <div>
              <Label>Baselane Account Name</Label>
              <Input className="mt-1" value={issueForm.baselane_account_name}
                onChange={e=>setIssueForm(p=>({...p,baselane_account_name:e.target.value}))} placeholder="Project Card - Smith" />
            </div>

            <Button className="w-full bg-[#0d1f1e] text-white hover:bg-[#1a3330]" onClick={issueCard}
              disabled={saving||!issueForm.application_id||(!issueForm.card_number&&!issueForm.card_last_four)}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}Issue Card (Draw Period)
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Transactions Dialog */}
      <Dialog open={showTxDialog} onOpenChange={setShowTxDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Transactions — •••• {selectedCard?.card_last_four}</DialogTitle>
          </DialogHeader>
          {selectedCard && (
            <div className="flex gap-4 text-sm bg-muted rounded-lg px-4 py-3">
              <span>Phase: <strong>{selectedCard.payment_phase === "draw_period" ? "Draw Period (Interest Only)" : "Repayment (P+I)"}</strong></span>
              <span>Drawn: <strong>{formatCurrency(selectedCard.drawn_amount)} / {formatCurrency(selectedCard.credit_limit)}</strong></span>
            </div>
          )}
          <div className="space-y-4">
            <div className="bg-muted rounded-xl p-4 space-y-3">
              <p className="font-semibold text-sm">Add Transaction / Draw</p>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Date</Label><Input className="mt-1" type="date" value={txForm.transaction_date} onChange={e=>setTxForm(p=>({...p,transaction_date:e.target.value}))} /></div>
                <div><Label>Amount ($)</Label><Input className="mt-1" type="number" step="0.01" value={txForm.amount} onChange={e=>setTxForm(p=>({...p,amount:e.target.value}))} /></div>
                <div><Label>Merchant / Payee</Label><Input className="mt-1" value={txForm.merchant_name} onChange={e=>setTxForm(p=>({...p,merchant_name:e.target.value}))} /></div>
                <div><Label>Category</Label><Input className="mt-1" value={txForm.category} onChange={e=>setTxForm(p=>({...p,category:e.target.value}))} placeholder="Materials / Labor" /></div>
              </div>
              <Input value={txForm.notes} onChange={e=>setTxForm(p=>({...p,notes:e.target.value}))} placeholder="Notes (optional)" />
              {selectedCard && txForm.amount && parseFloat(txForm.amount) + selectedCard.drawn_amount >= selectedCard.credit_limit && selectedCard.payment_phase === "draw_period" && (
                <p className="text-xs text-purple-700 font-medium bg-purple-50 rounded-lg px-3 py-2">
                  ⚡ This transaction will fully draw the card — repayment phase will start automatically.
                </p>
              )}
              <Button size="sm" onClick={addTransaction} disabled={saving||!txForm.transaction_date||!txForm.merchant_name||!txForm.amount}>
                {saving ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Plus className="w-3 h-3 mr-1" />}Add Transaction
              </Button>
            </div>
            <div className="border rounded-xl overflow-hidden">
              {transactions.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground text-sm">No transactions yet</div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-muted"><tr>
                    {["Date","Merchant","Category","Amount"].map(h=><th key={h} className="px-3 py-2 text-left font-semibold text-muted-foreground">{h}</th>)}
                  </tr></thead>
                  <tbody className="divide-y">
                    {transactions.map(tx => (
                      <tr key={tx.id} className="hover:bg-muted/40">
                        <td className="px-3 py-2">{new Date(tx.transaction_date).toLocaleDateString()}</td>
                        <td className="px-3 py-2 font-medium">{tx.merchant_name}</td>
                        <td className="px-3 py-2 text-muted-foreground">{tx.category || "—"}</td>
                        <td className="px-3 py-2 font-semibold">{formatCurrency(tx.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCards;
