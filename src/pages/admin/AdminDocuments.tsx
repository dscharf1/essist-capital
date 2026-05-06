import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Search, Loader2, FolderOpen, CheckCircle2, XCircle, ExternalLink } from "lucide-react";

interface DocRow {
  id: string;
  application_id: string;
  user_id: string;
  document_type: string;
  file_url: string;
  file_name: string;
  uploaded_at: string;
  verified: boolean | null;
  profiles?: { first_name: string; last_name: string } | null;
}

const DOC_LABELS: Record<string, string> = {
  id: "Government ID",
  proof_of_income: "Proof of Income",
  property_deed: "Property Deed",
  contractor_quote: "Contractor Quote",
  other: "Other",
};

const AdminDocuments = () => {
  const { toast } = useToast();
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => { fetchDocs(); }, []);

  const fetchDocs = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("documents")
      .select("*, profiles(first_name, last_name)")
      .order("uploaded_at", { ascending: false });
    if (!error) setDocs((data as DocRow[]) || []);
    setIsLoading(false);
  };

  const setVerified = async (docId: string, verified: boolean) => {
    setUpdating(docId);
    const { error } = await supabase.from("documents").update({ verified }).eq("id", docId);
    if (!error) {
      toast({ title: verified ? "Document verified" : "Document rejected" });
      fetchDocs();
    }
    setUpdating(null);
  };

  const filtered = docs.filter(d => {
    if (!search) return true;
    const name = `${d.profiles?.first_name||""} ${d.profiles?.last_name||""}`.toLowerCase();
    return name.includes(search.toLowerCase()) || d.file_name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Documents</h1>
        <p className="text-sm text-muted-foreground">Review and verify uploaded borrower documents</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search borrower or file..." value={search} onChange={e=>setSearch(e.target.value)} />
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm">
              <FolderOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />No documents found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>{["Borrower","Document Type","File Name","Uploaded","Status","Actions"].map(h=>(
                    <th key={h} className="px-4 py-3 text-left font-semibold text-muted-foreground">{h}</th>
                  ))}</tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map(doc => (
                    <tr key={doc.id} className="hover:bg-muted/40">
                      <td className="px-4 py-3 font-medium">{doc.profiles?.first_name} {doc.profiles?.last_name}</td>
                      <td className="px-4 py-3">{DOC_LABELS[doc.document_type] || doc.document_type}</td>
                      <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate">
                        <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="hover:text-primary flex items-center gap-1">
                          {doc.file_name}<ExternalLink className="w-3 h-3" />
                        </a>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{new Date(doc.uploaded_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        {doc.verified === null ? (
                          <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
                        ) : doc.verified ? (
                          <Badge className="bg-green-100 text-green-800">Verified</Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-800">Rejected</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          {doc.verified !== true && (
                            <Button variant="ghost" size="sm" className="text-green-700 hover:bg-green-50"
                              onClick={() => setVerified(doc.id, true)} disabled={updating === doc.id}>
                              {updating === doc.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3 mr-1" />}
                              Verify
                            </Button>
                          )}
                          {doc.verified !== false && (
                            <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50"
                              onClick={() => setVerified(doc.id, false)} disabled={updating === doc.id}>
                              <XCircle className="w-3 h-3 mr-1" />Reject
                            </Button>
                          )}
                        </div>
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

export default AdminDocuments;
