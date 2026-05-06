import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { email as emailLib } from "@/lib/email";
import { Bell, Loader2, Send, Users } from "lucide-react";

interface NotificationRow {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
  recipientName?: string;
}

interface ProfileRow {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
}

const TYPE_BADGE: Record<string, string> = {
  info:    "bg-blue-100 text-blue-800",
  success: "bg-green-100 text-green-800",
  warning: "bg-amber-100 text-amber-800",
  payment: "bg-purple-100 text-purple-800",
};

const AdminNotifications = () => {
  const { toast } = useToast();
  const [tab, setTab] = useState<"send" | "history">("send");
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({ recipient: "all", title: "", message: "", type: "info" });

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setIsLoading(true);
    const [notifRes, profileRes] = await Promise.all([
      supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(200),
      supabase.from("profiles").select("user_id, first_name, last_name, email"),
    ]);

    const profileMap: Record<string, ProfileRow> = {};
    for (const p of profileRes.data || []) profileMap[p.user_id] = p as ProfileRow;

    const notifs = (notifRes.data || []).map((n: NotificationRow) => ({
      ...n,
      recipientName: (() => {
        const p = profileMap[n.user_id];
        if (!p) return n.user_id.slice(0, 8) + "…";
        const name = `${p.first_name || ""} ${p.last_name || ""}`.trim();
        return name || p.email || n.user_id.slice(0, 8) + "…";
      })(),
    }));

    setNotifications(notifs);
    setProfiles((profileRes.data as ProfileRow[]) || []);
    setIsLoading(false);
  };

  const sendNotification = async () => {
    if (!form.title.trim() || !form.message.trim()) {
      toast({ title: "Title and message are required", variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      if (form.recipient === "all") {
        if (profiles.length === 0) throw new Error("No users found — make sure profiles loaded");
        const rows = profiles.map(p => ({
          user_id: p.user_id, title: form.title, message: form.message, type: form.type, read: false,
        }));
        const { error } = await supabase.from("notifications").insert(rows);
        if (error) throw error;
        // Send email to each user — fire and forget, don't block on failures
        for (const p of profiles) {
          emailLib.sendNotification(p.user_id, form.title, form.message).catch(console.error);
        }
        toast({ title: `Sent to ${rows.length} user${rows.length !== 1 ? "s" : ""}`, description: "In-app + email notifications dispatched." });
      } else {
        const { error } = await supabase.from("notifications").insert({
          user_id: form.recipient, title: form.title, message: form.message, type: form.type, read: false,
        });
        if (error) throw error;
        emailLib.sendNotification(form.recipient, form.title, form.message).catch(console.error);
        toast({ title: "Notification sent", description: "In-app + email notification dispatched." });
      }
      setForm({ recipient: "all", title: "", message: "", type: "info" });
      setTab("history");
      fetchAll();
    } catch (err: unknown) {
      toast({ title: (err as Error).message || "Failed to send", variant: "destructive" });
    } finally {
      setSending(false); }
  };

  return (
    <div className="space-y-5 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold text-[#0d1f1e]">Notifications</h1>
        <p className="text-xs text-gray-400 mt-0.5">Send messages to borrowers and review history</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 p-1 bg-white border border-gray-100 rounded-xl w-fit">
        {(["send", "history"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
              tab === t ? "bg-[#0d1f1e] text-white shadow-sm" : "text-gray-400 hover:text-[#0d1f1e]"
            }`}>
            {t === "send" ? <span className="flex items-center gap-1.5"><Send className="w-3.5 h-3.5" />Send</span>
                          : <span className="flex items-center gap-1.5"><Bell className="w-3.5 h-3.5" />History ({notifications.length})</span>}
          </button>
        ))}
      </div>

      {/* ── Send ── */}
      {tab === "send" && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 max-w-lg space-y-4">
          <div>
            <Label className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Recipient</Label>
            <Select value={form.recipient} onValueChange={v => setForm(p => ({ ...p, recipient: v }))}>
              <SelectTrigger className="mt-1 bg-white border-gray-200">
                <SelectValue placeholder="Select recipient" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <span className="flex items-center gap-2"><Users className="w-4 h-4" />All Borrowers ({profiles.length})</span>
                </SelectItem>
                {profiles.map(p => {
                  const name = [p.first_name, p.last_name].filter(Boolean).join(" ").trim();
                  return (
                    <SelectItem key={p.user_id} value={p.user_id}>
                      {name || p.email || "Unknown user"}
                      {name && p.email ? <span className="text-gray-400 ml-1">· {p.email}</span> : null}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Type</Label>
            <Select value={form.type} onValueChange={v => setForm(p => ({ ...p, type: v }))}>
              <SelectTrigger className="mt-1 bg-white border-gray-200"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="payment">Payment</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Title</Label>
            <Input className="mt-1 bg-white border-gray-200" placeholder="Notification title"
              value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
          </div>

          <div>
            <Label className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Message</Label>
            <Textarea className="mt-1 bg-white border-gray-200" rows={4}
              placeholder="Write your message here..."
              value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} />
          </div>

          <Button className="bg-[#0d1f1e] text-white hover:bg-[#1a3330]"
            onClick={sendNotification} disabled={sending || !form.title || !form.message}>
            {sending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
            {form.recipient === "all" ? `Send to All (${profiles.length})` : "Send"}
          </Button>
        </div>
      )}

      {/* ── History ── */}
      {tab === "history" && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-[#0d1f1e]" /></div>
          ) : notifications.length === 0 ? (
            <div className="py-16 text-center text-gray-400 text-sm">
              <Bell className="w-8 h-8 mx-auto mb-3 opacity-30" />No notifications sent yet
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    {["Recipient", "Type", "Title", "Message", "Read", "Sent"].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {notifications.map(n => (
                    <tr key={n.id} className="hover:bg-gray-50/60">
                      <td className="px-5 py-3.5 font-semibold text-[#0d1f1e]">{n.recipientName}</td>
                      <td className="px-5 py-3.5">
                        <Badge className={TYPE_BADGE[n.type] || "bg-gray-100 text-gray-700"}>{n.type}</Badge>
                      </td>
                      <td className="px-5 py-3.5 font-medium text-[#0d1f1e]">{n.title}</td>
                      <td className="px-5 py-3.5 text-gray-400 max-w-[240px] truncate">{n.message}</td>
                      <td className="px-5 py-3.5">
                        {n.read
                          ? <Badge className="bg-emerald-100 text-emerald-700 text-xs">Read</Badge>
                          : <Badge className="bg-gray-100 text-gray-500 text-xs">Unread</Badge>}
                      </td>
                      <td className="px-5 py-3.5 text-gray-400 text-xs whitespace-nowrap">
                        {new Date(n.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminNotifications;
