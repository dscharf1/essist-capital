import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { PaymentMethodForm } from "@/components/payments/PaymentMethodForm";
import { RepaymentScheduleCard } from "@/components/payments/RepaymentScheduleCard";
import { PaymentHistory } from "@/components/payments/PaymentHistory";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface RepaymentSchedule {
  id: string;
  application_id: string;
  payment_method_id: string | null;
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
  stripe_customer_id: string;
}

interface Payment {
  id: string;
  amount: number;
  status: string;
  payment_date: string;
  processed_at: string | null;
  failure_reason: string | null;
}

interface Application {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  project_type: string;
  requested_amount: number;
}

export default function PaymentSetup() {
  const { applicationId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [application, setApplication] = useState<Application | null>(null);
  const [schedule, setSchedule] = useState<RepaymentSchedule | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);

  useEffect(() => {
    if (applicationId) {
      fetchData();
    }
  }, [applicationId]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch application
      const { data: appData, error: appError } = await supabase
        .from("loan_applications")
        .select("*")
        .eq("id", applicationId)
        .single();

      if (appError) throw appError;
      setApplication(appData);

      // Fetch repayment schedule
      const { data: scheduleData } = await supabase
        .from("repayment_schedules")
        .select("*")
        .eq("application_id", applicationId)
        .maybeSingle();

      setSchedule(scheduleData);

      if (scheduleData?.payment_method_id) {
        // Fetch payment method
        const { data: methodData } = await supabase
          .from("payment_methods")
          .select("*")
          .eq("id", scheduleData.payment_method_id)
          .single();

        setPaymentMethod(methodData);
      } else if (user) {
        // Check if user has any payment methods
        const { data: methodData } = await supabase
          .from("payment_methods")
          .select("*")
          .eq("user_id", user.id)
          .eq("is_default", true)
          .maybeSingle();

        setPaymentMethod(methodData);
      }

      // Fetch payments
      if (scheduleData) {
        const { data: paymentsData } = await supabase
          .from("payments")
          .select("*")
          .eq("schedule_id", scheduleData.id)
          .order("payment_date", { ascending: false });

        setPayments(paymentsData || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to load payment information",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentMethodSuccess = async () => {
    // Refetch data to get the new payment method
    await fetchData();

    // If there's a schedule without a payment method, link them
    if (schedule && !schedule.payment_method_id && user) {
      const { data: newMethod } = await supabase
        .from("payment_methods")
        .select("id")
        .eq("user_id", user.id)
        .eq("is_default", true)
        .maybeSingle();

      if (newMethod) {
        await supabase
          .from("repayment_schedules")
          .update({ payment_method_id: newMethod.id })
          .eq("id", schedule.id);

        await fetchData();
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="grid gap-6 lg:grid-cols-2">
            <Skeleton className="h-96" />
            <Skeleton className="h-64" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!application) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold mb-4">Application Not Found</h1>
            <p className="text-muted-foreground mb-6">
              The loan application you're looking for doesn't exist.
            </p>
            <Button onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate(`/application/${applicationId}`)}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Application
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold">Payment Setup</h1>
          <p className="text-muted-foreground">
            {application.project_type} • ${application.requested_amount.toLocaleString()}
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            {!schedule ? (
              <Card>
                <CardHeader>
                  <CardTitle>No Repayment Schedule</CardTitle>
                  <CardDescription>
                    A repayment schedule will be created once your loan is approved and funded.
                  </CardDescription>
                </CardHeader>
              </Card>
            ) : (
              <RepaymentScheduleCard schedule={schedule} paymentMethod={paymentMethod} />
            )}

            {payments.length > 0 && <PaymentHistory payments={payments} />}
          </div>

          <div>
            {paymentMethod ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    Payment Method Configured
                  </CardTitle>
                  <CardDescription>
                    Your automatic monthly payments are set up
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg bg-muted p-4">
                    <div className="flex items-center gap-3">
                      {paymentMethod.payment_type === "card" ? (
                        <>
                          <div className="h-10 w-16 bg-gradient-to-br from-slate-700 to-slate-900 rounded flex items-center justify-center text-white text-xs font-bold">
                            {paymentMethod.brand?.toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium">
                              •••• •••• •••• {paymentMethod.last_four}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Credit/Debit Card
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="h-10 w-16 bg-gradient-to-br from-blue-600 to-blue-800 rounded flex items-center justify-center text-white text-xs font-bold">
                            BANK
                          </div>
                          <div>
                            <p className="font-medium">
                              {paymentMethod.bank_name} •••• {paymentMethod.last_four}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Bank Account (ACH)
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-4">
                    Your payment will be automatically processed on the due date each month.
                    You'll receive email reminders 7 days and 3 days before each payment.
                  </p>
                </CardContent>
              </Card>
            ) : user && (
              <PaymentMethodForm
                applicationId={applicationId}
                userId={user.id}
                email={application.email}
                name={`${application.first_name} ${application.last_name}`}
                onSuccess={handlePaymentMethodSuccess}
              />
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
