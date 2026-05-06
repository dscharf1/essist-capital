import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, MessageSquare, Search } from "lucide-react";

interface ContactMessage {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  created_at: string;
}

const AdminContactMessages = () => {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => { fetchMessages(); }, []);

  const fetchMessages = async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from("contact_messages")
      .select("*")
      .order("created_at", { ascending: false });
    setMessages((data as ContactMessage[]) || []);
    setIsLoading(false);
  };

  const filtered = messages.filter(m => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      `${m.first_name} ${m.last_name}`.toLowerCase().includes(s) ||
      m.email.toLowerCase().includes(s) ||
      (m.subject || "").toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Contact Messages</h1>
        <p className="text-sm text-muted-foreground">Messages submitted through the contact form</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search name, email or subject..."
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm">
              <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />No messages yet
            </div>
          ) : (
            <div className="divide-y">
              {filtered.map(m => (
                <div key={m.id} className="px-4 py-4 hover:bg-muted/40 cursor-pointer"
                  onClick={() => setExpanded(expanded === m.id ? null : m.id)}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium">{m.first_name} {m.last_name}</p>
                      <p className="text-sm text-muted-foreground">{m.email}{m.phone ? ` · ${m.phone}` : ""}</p>
                      {m.subject && <p className="text-sm font-medium mt-1">{m.subject}</p>}
                    </div>
                    <p className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(m.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  {expanded === m.id && (
                    <div className="mt-3 p-3 bg-muted rounded-lg text-sm whitespace-pre-wrap">
                      {m.message}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminContactMessages;
