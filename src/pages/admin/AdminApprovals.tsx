import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  DollarSign,
  User,
  Loader2,
} from "lucide-react";

const AdminApprovals = () => {
  const { toast } = useToast();
  const [applications, setApplications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from("loan_applications")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) {
      setApplications(data);
    }
    setIsLoading(false);
  };

  const pendingApps = applications.filter(
    (a) => a.status === "submitted" || a.status === "document_sent"
  );
  const inProgressApps = applications.filter(
    (a) =>
      a.status === "document_signed" ||
      a.status === "card_provisioned" ||
      a.status === "project_started" ||
      a.status === "inspection_pending"
  );
  const completedApps = applications.filter(
    (a) =>
      a.status === "inspection_passed" ||
      a.status === "funds_released" ||
      a.status === "completed"
  );

  const handleApprove = async (applicationId: string) => {
    setProcessingId(applicationId);
    try {
      // Simulate DocuSign sending and card provisioning
      const { error } = await supabase.functions.invoke("workflow-webhook", {
        body: { action: "sign_document", applicationId },
      });

      if (error) throw error;

      toast({
        title: "Application Approved",
        description: "Document signed and card provisioned successfully.",
      });

      loadApplications();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve application",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (applicationId: string) => {
    setProcessingId(applicationId);
    try {
      await supabase
        .from("loan_applications")
        .update({ status: "rejected" })
        .eq("id", applicationId);

      toast({
        title: "Application Rejected",
        description: "The application has been rejected.",
      });

      loadApplications();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject application",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const ApplicationCard = ({ app, showActions = false }: { app: any; showActions?: boolean }) => (
    <Card className="mb-4">
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <User className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">
                {app.first_name} {app.last_name}
              </h3>
              <p className="text-sm text-muted-foreground">{app.email}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant="outline">
                  <FileText className="w-3 h-3 mr-1" />
                  {app.project_type}
                </Badge>
                <Badge variant="outline">
                  <DollarSign className="w-3 h-3 mr-1" />
                  ${Number(app.requested_amount).toLocaleString()}
                </Badge>
                <Badge
                  className={
                    app.status === "rejected"
                      ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      : app.status === "funds_released" || app.status === "completed"
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                  }
                >
                  {app.status?.replace(/_/g, " ")}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right mr-4">
              <p className="text-xs text-muted-foreground">Submitted</p>
              <p className="text-sm font-medium">
                {new Date(app.created_at).toLocaleDateString()}
              </p>
            </div>

            {showActions && app.status !== "rejected" && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleReject(app.id)}
                  disabled={processingId === app.id}
                  className="text-destructive hover:text-destructive"
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  Reject
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleApprove(app.id)}
                  disabled={processingId === app.id}
                >
                  {processingId === app.id ? (
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 mr-1" />
                  )}
                  Approve
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Approvals</h1>
        <p className="text-muted-foreground">Review and manage loan applications</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Pending Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{pendingApps.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Loader2 className="w-4 h-4" />
              In Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{inProgressApps.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{completedApps.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending" className="gap-2">
            Pending
            {pendingApps.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {pendingApps.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="in-progress">In Progress</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          {pendingApps.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No pending applications
              </CardContent>
            </Card>
          ) : (
            pendingApps.map((app) => (
              <ApplicationCard key={app.id} app={app} showActions />
            ))
          )}
        </TabsContent>

        <TabsContent value="in-progress" className="mt-6">
          {inProgressApps.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No applications in progress
              </CardContent>
            </Card>
          ) : (
            inProgressApps.map((app) => <ApplicationCard key={app.id} app={app} />)
          )}
        </TabsContent>

        <TabsContent value="completed" className="mt-6">
          {completedApps.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No completed applications
              </CardContent>
            </Card>
          ) : (
            completedApps.map((app) => <ApplicationCard key={app.id} app={app} />)
          )}
        </TabsContent>

        <TabsContent value="all" className="mt-6">
          {applications.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No applications
              </CardContent>
            </Card>
          ) : (
            applications.map((app) => <ApplicationCard key={app.id} app={app} />)
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminApprovals;
