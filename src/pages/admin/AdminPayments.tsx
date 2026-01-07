import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  RefreshCw,
  DollarSign,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface RepaymentSchedule {
  id: string;
  application_id: string;
  monthly_amount: number;
  total_amount: number;
  remaining_balance: number;
  next_payment_date: string;
  payments_made: number;
  total_payments: number;
  status: string;
  created_at: string;
  loan_application?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface Payment {
  id: string;
  schedule_id: string;
  application_id: string;
  amount: number;
  status: string;
  payment_date: string;
  processed_at: string | null;
  failure_reason: string | null;
  stripe_payment_intent_id: string | null;
  created_at: string;
  loan_application?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

const AdminPayments = () => {
  const { toast } = useToast();
  const [schedules, setSchedules] = useState<RepaymentSchedule[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [retryingPayment, setRetryingPayment] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    
    // Load repayment schedules with application info
    const { data: schedulesData } = await supabase
      .from("repayment_schedules")
      .select(`
        *,
        loan_application:loan_applications(first_name, last_name, email)
      `)
      .order("created_at", { ascending: false });

    // Load payments with application info
    const { data: paymentsData } = await supabase
      .from("payments")
      .select(`
        *,
        loan_application:loan_applications(first_name, last_name, email)
      `)
      .order("payment_date", { ascending: false });

    if (schedulesData) {
      setSchedules(schedulesData as unknown as RepaymentSchedule[]);
    }
    if (paymentsData) {
      setPayments(paymentsData as unknown as Payment[]);
    }
    
    setIsLoading(false);
  };

  const handleRetryPayment = async (paymentId: string) => {
    setRetryingPayment(paymentId);
    
    try {
      const response = await supabase.functions.invoke("process-payment", {
        body: { action: "retry", paymentId },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      toast({
        title: "Payment retry initiated",
        description: "The payment is being reprocessed.",
      });

      // Reload data after retry
      await loadData();
    } catch (error: any) {
      toast({
        title: "Retry failed",
        description: error.message || "Failed to retry payment",
        variant: "destructive",
      });
    } finally {
      setRetryingPayment(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Active</Badge>;
      case "completed":
        return <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Completed</Badge>;
      case "defaulted":
        return <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">Defaulted</Badge>;
      case "paused":
        return <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">Paused</Badge>;
      case "succeeded":
        return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Succeeded</Badge>;
      case "failed":
        return <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">Failed</Badge>;
      case "pending":
        return <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">Pending</Badge>;
      case "processing":
        return <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Processing</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const filteredSchedules = schedules.filter((schedule) => {
    const matchesSearch =
      schedule.loan_application?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      schedule.loan_application?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      schedule.loan_application?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || schedule.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredPayments = payments.filter((payment) => {
    const matchesSearch =
      payment.loan_application?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.loan_application?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.loan_application?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || payment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate stats
  const stats = {
    totalSchedules: schedules.length,
    activeSchedules: schedules.filter((s) => s.status === "active").length,
    defaultedSchedules: schedules.filter((s) => s.status === "defaulted").length,
    totalCollected: payments
      .filter((p) => p.status === "succeeded")
      .reduce((sum, p) => sum + Number(p.amount), 0),
    failedPayments: payments.filter((p) => p.status === "failed").length,
    pendingPayments: payments.filter((p) => p.status === "pending").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Payments</h1>
          <p className="text-muted-foreground">Manage repayment schedules and payment history</p>
        </div>
        <Button onClick={loadData} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Schedules
            </CardTitle>
            <CheckCircle2 className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeSchedules}</div>
            <p className="text-xs text-muted-foreground">
              of {stats.totalSchedules} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Collected
            </CardTitle>
            <DollarSign className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.totalCollected.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">from successful payments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Failed Payments
            </CardTitle>
            <XCircle className="w-4 h-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.failedPayments}</div>
            <p className="text-xs text-muted-foreground">require attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Defaulted Accounts
            </CardTitle>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.defaultedSchedules}</div>
            <p className="text-xs text-muted-foreground">cards locked</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by client name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="defaulted">Defaulted</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="succeeded">Succeeded</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="schedules" className="space-y-4">
        <TabsList>
          <TabsTrigger value="schedules" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Repayment Schedules
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Payment History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="schedules">
          <Card>
            <CardHeader>
              <CardTitle>Repayment Schedules</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Monthly Amount</TableHead>
                    <TableHead>Remaining Balance</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Next Payment</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : filteredSchedules.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No repayment schedules found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSchedules.map((schedule) => (
                      <TableRow key={schedule.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {schedule.loan_application?.first_name}{" "}
                              {schedule.loan_application?.last_name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {schedule.loan_application?.email}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          ${Number(schedule.monthly_amount).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          ${Number(schedule.remaining_balance).toLocaleString()}
                          <span className="text-muted-foreground text-sm">
                            {" "}/ ${Number(schedule.total_amount).toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full"
                                style={{
                                  width: `${((schedule.payments_made || 0) / schedule.total_payments) * 100}%`,
                                }}
                              />
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {schedule.payments_made || 0}/{schedule.total_payments}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {format(new Date(schedule.next_payment_date), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>{getStatusBadge(schedule.status)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Payment Date</TableHead>
                    <TableHead>Processed At</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : filteredPayments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No payments found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPayments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {payment.loan_application?.first_name}{" "}
                              {payment.loan_application?.last_name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {payment.loan_application?.email}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          ${Number(payment.amount).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {format(new Date(payment.payment_date), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          {payment.processed_at
                            ? format(new Date(payment.processed_at), "MMM d, yyyy h:mm a")
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {getStatusBadge(payment.status)}
                            {payment.failure_reason && (
                              <p className="text-xs text-red-500">{payment.failure_reason}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {payment.status === "failed" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRetryPayment(payment.id)}
                              disabled={retryingPayment === payment.id}
                            >
                              {retryingPayment === payment.id ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  <RefreshCw className="w-4 h-4 mr-1" />
                                  Retry
                                </>
                              )}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPayments;
