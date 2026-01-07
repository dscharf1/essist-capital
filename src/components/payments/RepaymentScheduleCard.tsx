import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CalendarDays, CreditCard, Building2, DollarSign, AlertTriangle } from "lucide-react";

interface RepaymentSchedule {
  id: string;
  monthly_amount: number;
  total_amount: number;
  remaining_balance: number;
  next_payment_date: string;
  payments_made: number;
  total_payments: number;
  status: string;
}

interface PaymentMethod {
  id: string;
  payment_type: string;
  last_four: string | null;
  brand: string | null;
  bank_name: string | null;
}

interface RepaymentScheduleCardProps {
  schedule: RepaymentSchedule;
  paymentMethod?: PaymentMethod | null;
}

export function RepaymentScheduleCard({ schedule, paymentMethod }: RepaymentScheduleCardProps) {
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);

  const progressPercent = (schedule.payments_made / schedule.total_payments) * 100;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="default">Active</Badge>;
      case "completed":
        return <Badge className="bg-green-500">Completed</Badge>;
      case "defaulted":
        return <Badge variant="destructive">Defaulted</Badge>;
      case "paused":
        return <Badge variant="secondary">Paused</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const daysUntilPayment = () => {
    const today = new Date();
    const paymentDate = new Date(schedule.next_payment_date);
    const diffTime = paymentDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const days = daysUntilPayment();

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Repayment Schedule</CardTitle>
          {getStatusBadge(schedule.status)}
        </div>
        <CardDescription>
          {schedule.payments_made} of {schedule.total_payments} payments made
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{Math.round(progressPercent)}%</span>
          </div>
          <Progress value={progressPercent} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              Monthly Payment
            </div>
            <p className="text-xl font-semibold">{formatCurrency(schedule.monthly_amount)}</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarDays className="h-4 w-4" />
              Next Payment
            </div>
            <p className="text-xl font-semibold">
              {new Date(schedule.next_payment_date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </p>
            {days <= 7 && days > 0 && schedule.status === "active" && (
              <p className="text-xs text-amber-600 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Due in {days} day{days !== 1 ? "s" : ""}
              </p>
            )}
            {days <= 0 && schedule.status === "active" && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Payment overdue
              </p>
            )}
          </div>
        </div>

        <div className="pt-2 border-t">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Remaining Balance</span>
            <span className="font-medium">{formatCurrency(schedule.remaining_balance)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total Loan</span>
            <span>{formatCurrency(schedule.total_amount)}</span>
          </div>
        </div>

        {paymentMethod && (
          <div className="pt-2 border-t">
            <div className="flex items-center gap-2 text-sm">
              {paymentMethod.payment_type === "card" ? (
                <>
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {paymentMethod.brand?.toUpperCase()} •••• {paymentMethod.last_four}
                  </span>
                </>
              ) : (
                <>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {paymentMethod.bank_name} •••• {paymentMethod.last_four}
                  </span>
                </>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
