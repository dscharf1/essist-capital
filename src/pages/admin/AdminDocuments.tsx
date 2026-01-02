import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  FileText,
  Download,
  Eye,
  FolderOpen,
  File,
  FileSignature,
  Clock,
  CheckCircle2,
} from "lucide-react";

interface Document {
  id: string;
  application_id: string;
  document_type: string;
  status: string;
  sent_at: string | null;
  signed_at: string | null;
  envelope_id: string | null;
  created_at: string;
  applicant_name?: string;
}

const AdminDocuments = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFolder, setSelectedFolder] = useState("all");

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    setIsLoading(true);
    const { data: docs } = await supabase
      .from("documents")
      .select("*")
      .order("created_at", { ascending: false });

    if (docs) {
      // Get application details for each document
      const { data: apps } = await supabase.from("loan_applications").select("id, first_name, last_name");
      
      const docsWithNames = docs.map((doc) => {
        const app = apps?.find((a) => a.id === doc.application_id);
        return {
          ...doc,
          applicant_name: app ? `${app.first_name} ${app.last_name}` : "Unknown",
        };
      });
      
      setDocuments(docsWithNames);
    }
    setIsLoading(false);
  };

  const folders = [
    { id: "all", name: "All Documents", icon: FolderOpen, count: documents.length },
    {
      id: "pending",
      name: "Pending Signature",
      icon: Clock,
      count: documents.filter((d) => d.status === "pending" || d.status === "sent").length,
    },
    {
      id: "signed",
      name: "Signed",
      icon: CheckCircle2,
      count: documents.filter((d) => d.status === "signed").length,
    },
    {
      id: "loan_agreement",
      name: "Loan Agreements",
      icon: FileSignature,
      count: documents.filter((d) => d.document_type === "loan_agreement").length,
    },
  ];

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.applicant_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.envelope_id?.toLowerCase().includes(searchTerm.toLowerCase());

    if (selectedFolder === "all") return matchesSearch;
    if (selectedFolder === "pending")
      return matchesSearch && (doc.status === "pending" || doc.status === "sent");
    if (selectedFolder === "signed") return matchesSearch && doc.status === "signed";
    if (selectedFolder === "loan_agreement")
      return matchesSearch && doc.document_type === "loan_agreement";
    return matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "signed":
        return (
          <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Signed
          </Badge>
        );
      case "sent":
        return (
          <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
            <Clock className="w-3 h-3 mr-1" />
            Sent
          </Badge>
        );
      default:
        return (
          <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Documents</h1>
        <p className="text-muted-foreground">Manage loan documents and signatures</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Folder Sidebar */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Folders</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-1 p-2">
              {folders.map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => setSelectedFolder(folder.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                    selectedFolder === folder.id
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <folder.icon className="w-4 h-4" />
                    <span className="text-sm">{folder.name}</span>
                  </div>
                  <Badge
                    variant="secondary"
                    className={
                      selectedFolder === folder.id
                        ? "bg-primary-foreground/20 text-primary-foreground"
                        : ""
                    }
                  >
                    {folder.count}
                  </Badge>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Documents List */}
        <div className="lg:col-span-3 space-y-4">
          {/* Search */}
          <Card>
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search documents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Documents Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">
                        Document
                      </th>
                      <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">
                        Applicant
                      </th>
                      <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">
                        Status
                      </th>
                      <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">
                        Date
                      </th>
                      <th className="text-right py-4 px-4 text-sm font-medium text-muted-foreground">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDocuments.map((doc) => (
                      <tr
                        key={doc.id}
                        className="border-b border-border/50 hover:bg-muted/50"
                      >
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              <FileText className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium capitalize">
                                {doc.document_type.replace(/_/g, " ")}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {doc.envelope_id || "No envelope ID"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-sm">{doc.applicant_name}</td>
                        <td className="py-4 px-4">{getStatusBadge(doc.status)}</td>
                        <td className="py-4 px-4 text-sm text-muted-foreground">
                          {doc.signed_at
                            ? new Date(doc.signed_at).toLocaleDateString()
                            : doc.sent_at
                            ? new Date(doc.sent_at).toLocaleDateString()
                            : new Date(doc.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon">
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredDocuments.length === 0 && (
                  <div className="py-12 text-center text-muted-foreground">
                    <File className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No documents found</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDocuments;
