import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Clock, Play, RefreshCw, Loader2 } from "lucide-react";

interface CronJobDef {
  key: string;
  label: string;
  description: string;
  schedule: string;
  edgeFn: string;
  payload: Record<string, string>;
}

const JOBS: CronJobDef[] = [
  {
    key: "payment_reminder_7day",
    label: "7-Day Payment Reminder",
    description: "Emails borrowers 7 days before payment is due",
    schedule: "0 9 * * *",
    edgeFn: "payment_reminders",
    payload: { type: "7day" },
  },
  {
    key: "payment_reminder_3day",
    label: "3-Day Payment Reminder",
    description: "Emails borrowers 3 days before payment is due",
    schedule: "0 9 * * *",
    edgeFn: "payment_reminders",
    payload: { type: "3day" },
  },
  {
    key: "payment_reminder_24hr",
    label: "24-Hour Payment Reminder",
    description: "Emails borrowers 24 hours before payment is due",
    schedule: "0 9 * * *",
    edgeFn: "payment_reminders",
    payload: { type: "24hr" },
  },
  {
    key: "payment_due_today",
    label: "Payment Due Today",
    description: "Emails borrowers on the day their payment is due",
    schedule: "0 8 * * *",
    edgeFn: "payment_reminders",
    payload: { type: "due_today" },
  },
  {
    key: "late_payment_flag",
    label: "Late Payment Flag",
    description: "Marks overdue payments as missed and notifies borrowers",
    schedule: "0 10 * * *",
    edgeFn: "payment_reminders",
    payload: { type: "missed" },
  },
  {
    key: "monthly_statement",
    label: "Monthly Statement",
    description: "Sends monthly payment summary to all active borrowers",
    schedule: "0 9 1 * *",
    edgeFn: "payment_reminders",
    payload: { type: "monthly_statement" },
  },
];

const formatSchedule = (cron: string) => {
  const map: Record<string, string> = {
    "0 9 * * *": "Daily at 9:00 AM UTC",
    "0 8 * * *": "Daily at 8:00 AM UTC",
    "0 10 * * *": "Daily at 10:00 AM UTC",
    "0 9 1 * *": "1st of each month, 9:00 AM UTC",
  };
  return map[cron] || cron;
};

const AdminCronJobs = () => {
  const { toast } = useToast();
  const [running, setRunning] = useState<string | null>(null);
  const [lastRun, setLastRun] = useState<Record<string, string>>({});

  const triggerJob = async (job: CronJobDef) => {
    setRunning(job.key);
    try {
      const { error } = await supabase.functions.invoke(job.edgeFn, { body: job.payload });
      if (error) throw error;
      const now = new Date().toLocaleString("en-US", {
        month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
      });
      setLastRun(prev => ({ ...prev, [job.key]: now }));
      toast({ title: `${job.label} triggered successfully` });
    } catch (err: unknown) {
      toast({
        title: `Failed to trigger ${job.label}`,
        description: (err as Error).message,
        variant: "destructive",
      });
    } finally {
      setRunning(null);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Scheduled Jobs</h1>
        <p className="text-sm text-muted-foreground">
          Payment reminder and statement jobs — scheduled via Supabase pg_cron
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>{["Job", "Description", "Schedule", "Status", "Last Manual Run", "Actions"].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-muted-foreground">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y">
                {JOBS.map(job => (
                  <tr key={job.key} className="hover:bg-muted/40">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 font-medium">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        {job.label}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground max-w-[220px]">{job.description}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      <div>{formatSchedule(job.schedule)}</div>
                      <div className="text-[10px] mt-0.5 opacity-60">{job.schedule}</div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className="bg-green-100 text-green-800">
                        <RefreshCw className="w-3 h-3 mr-1" />Active
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {lastRun[job.key] || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => triggerJob(job)}
                        disabled={running === job.key}
                      >
                        {running === job.key
                          ? <Loader2 className="w-3 h-3 animate-spin mr-1" />
                          : <Play className="w-3 h-3 mr-1" />}
                        Run Now
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="text-xs text-muted-foreground bg-muted rounded-lg px-4 py-3">
        <strong>Note:</strong> These jobs run automatically on schedule via Supabase pg_cron. Use "Run Now" to trigger a job
        manually for testing. Schedule changes must be made directly in the Supabase dashboard under Database → Cron Jobs.
      </div>
    </div>
  );
};

export default AdminCronJobs;
