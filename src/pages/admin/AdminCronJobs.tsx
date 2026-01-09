import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, Play, CheckCircle, XCircle, AlertCircle, RefreshCw, Timer, Calendar } from "lucide-react";
import { toast } from "sonner";

interface CronJob {
  jobid: number;
  jobname: string;
  schedule: string;
  command: string;
  active: boolean;
}

interface CronJobRun {
  runid: number;
  jobid: number;
  jobname: string;
  status: string;
  return_message: string;
  start_time: string;
  end_time: string;
}

export default function AdminCronJobs() {
  const [refreshing, setRefreshing] = useState(false);

  const { data: jobs, isLoading: jobsLoading, refetch: refetchJobs } = useQuery({
    queryKey: ["cron-jobs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cron_job_status")
        .select("*");
      if (error) throw error;
      return data as CronJob[];
    },
  });

  const { data: history, isLoading: historyLoading, refetch: refetchHistory } = useQuery({
    queryKey: ["cron-job-history"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cron_job_history")
        .select("*")
        .order("start_time", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as CronJobRun[];
    },
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchJobs(), refetchHistory()]);
    setRefreshing(false);
    toast.success("Data refreshed");
  };

  const handleManualTrigger = async (jobName: string) => {
    let functionName = "";
    let body = {};

    if (jobName.includes("reminders")) {
      functionName = "send-payment-reminders";
    } else if (jobName.includes("processing")) {
      functionName = "process-payment";
      body = { action: "process_scheduled_payments" };
    } else if (jobName.includes("missed")) {
      functionName = "check-missed-payments";
    }

    if (!functionName) {
      toast.error("Unknown job type");
      return;
    }

    toast.loading(`Triggering ${functionName}...`);
    
    const { data, error } = await supabase.functions.invoke(functionName, { body });
    
    toast.dismiss();
    
    if (error) {
      toast.error(`Failed: ${error.message}`);
    } else {
      toast.success(`${functionName} executed successfully`);
      refetchHistory();
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "succeeded":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "running":
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "succeeded":
        return <Badge className="bg-green-100 text-green-800">Succeeded</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      case "running":
        return <Badge className="bg-blue-100 text-blue-800">Running</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatSchedule = (schedule: string) => {
    const scheduleMap: Record<string, string> = {
      "0 9 * * *": "Daily at 9:00 AM UTC",
      "0 10 * * *": "Daily at 10:00 AM UTC",
      "0 11 * * *": "Daily at 11:00 AM UTC",
    };
    return scheduleMap[schedule] || schedule;
  };

  const formatDuration = (start: string, end: string) => {
    if (!start || !end) return "-";
    const duration = new Date(end).getTime() - new Date(start).getTime();
    if (duration < 1000) return `${duration}ms`;
    return `${(duration / 1000).toFixed(1)}s`;
  };

  const paymentJobs = jobs?.filter(j => 
    j.jobname?.includes("payment") || j.jobname?.includes("reminder") || j.jobname?.includes("missed")
  ) || [];

  const successCount = history?.filter(h => h.status === "succeeded").length || 0;
  const failedCount = history?.filter(h => h.status === "failed").length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Cron Job Monitor</h1>
          <p className="text-muted-foreground">View scheduled jobs and execution history</p>
          </div>
          <Button onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{paymentJobs.filter(j => j.active).length}</div>
              <p className="text-xs text-muted-foreground">Payment-related cron jobs</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Recent Runs</CardTitle>
              <Timer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{history?.length || 0}</div>
              <p className="text-xs text-muted-foreground">Total executions logged</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Successful</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{successCount}</div>
              <p className="text-xs text-muted-foreground">Completed successfully</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Failed</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{failedCount}</div>
              <p className="text-xs text-muted-foreground">Execution failures</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="jobs" className="space-y-4">
          <TabsList>
            <TabsTrigger value="jobs">Scheduled Jobs</TabsTrigger>
            <TabsTrigger value="history">Execution History</TabsTrigger>
          </TabsList>

          <TabsContent value="jobs">
            <Card>
              <CardHeader>
                <CardTitle>Payment Cron Jobs</CardTitle>
                <CardDescription>Automated payment processing schedules</CardDescription>
              </CardHeader>
              <CardContent>
                {jobsLoading ? (
                  <p className="text-muted-foreground">Loading jobs...</p>
                ) : paymentJobs.length === 0 ? (
                  <p className="text-muted-foreground">No payment cron jobs found. Jobs will appear after first execution.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Job Name</TableHead>
                        <TableHead>Schedule</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paymentJobs.map((job) => (
                        <TableRow key={job.jobid}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              {job.jobname}
                            </div>
                          </TableCell>
                          <TableCell>{formatSchedule(job.schedule)}</TableCell>
                          <TableCell>
                            <Badge variant={job.active ? "default" : "secondary"}>
                              {job.active ? "Active" : "Paused"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleManualTrigger(job.jobname)}
                            >
                              <Play className="h-3 w-3 mr-1" />
                              Run Now
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Execution History</CardTitle>
                <CardDescription>Recent cron job runs and their results</CardDescription>
              </CardHeader>
              <CardContent>
                {historyLoading ? (
                  <p className="text-muted-foreground">Loading history...</p>
                ) : !history || history.length === 0 ? (
                  <p className="text-muted-foreground">No execution history yet. Jobs will be logged after they run.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Job</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Started</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Message</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {history.map((run) => (
                        <TableRow key={run.runid}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(run.status)}
                              {run.jobname || `Job #${run.jobid}`}
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(run.status)}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {run.start_time 
                              ? new Date(run.start_time).toLocaleString()
                              : "-"
                            }
                          </TableCell>
                          <TableCell className="text-sm">
                            {formatDuration(run.start_time, run.end_time)}
                          </TableCell>
                          <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                            {run.return_message || "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
  );
}
