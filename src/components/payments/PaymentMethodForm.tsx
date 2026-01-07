import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CreditCard, Building2, Loader2, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

interface PaymentMethodFormProps {
  applicationId?: string;
  userId: string;
  email: string;
  name: string;
  onSuccess?: () => void;
}

function PaymentMethodSetupForm({ 
  onPaymentMethodSaved 
}: { 
  onPaymentMethodSaved: (paymentMethodId: string) => void 
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error, setupIntent } = await stripe.confirmSetup({
        elements,
        redirect: "if_required",
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else if (setupIntent && setupIntent.status === "succeeded") {
        const paymentMethodId = setupIntent.payment_method as string;
        onPaymentMethodSaved(paymentMethodId);
      }
    } catch (err) {
      console.error("Setup error:", err);
      toast({
        title: "Error",
        description: "Failed to set up payment method",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button 
        type="submit" 
        disabled={!stripe || isProcessing}
        className="w-full"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          "Save Payment Method"
        )}
      </Button>
    </form>
  );
}

export function PaymentMethodForm({ 
  applicationId, 
  userId, 
  email, 
  name,
  onSuccess 
}: PaymentMethodFormProps) {
  const [paymentType, setPaymentType] = useState<"card" | "ach">("card");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const { toast } = useToast();

  const createSetupIntent = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("stripe-payment-setup", {
        body: {
          action: "create_setup_intent",
          applicationId,
          userId,
          email,
          name,
          paymentType,
        },
      });

      if (error) throw error;
      
      setClientSecret(data.clientSecret);
    } catch (err) {
      console.error("Failed to create setup intent:", err);
      toast({
        title: "Error",
        description: "Failed to initialize payment setup",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentMethodSaved = async (paymentMethodId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("stripe-payment-setup", {
        body: {
          action: "save_payment_method",
          applicationId,
          userId,
          email,
          paymentMethodId,
        },
      });

      if (error) throw error;

      setIsComplete(true);
      toast({
        title: "Success",
        description: "Payment method saved successfully",
      });
      
      onSuccess?.();
    } catch (err) {
      console.error("Failed to save payment method:", err);
      toast({
        title: "Error",
        description: "Failed to save payment method",
        variant: "destructive",
      });
    }
  };

  if (isComplete) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-4 py-8">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
            <h3 className="text-xl font-semibold">Payment Method Saved!</h3>
            <p className="text-muted-foreground text-center">
              Your {paymentType === "card" ? "card" : "bank account"} has been saved for automatic monthly payments.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Set Up Payment Method</CardTitle>
        <CardDescription>
          Choose how you'd like to pay your monthly loan payments
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!clientSecret ? (
          <>
            <RadioGroup
              value={paymentType}
              onValueChange={(value) => setPaymentType(value as "card" | "ach")}
              className="grid grid-cols-2 gap-4"
            >
              <div>
                <RadioGroupItem
                  value="card"
                  id="card"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="card"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                >
                  <CreditCard className="mb-3 h-8 w-8" />
                  <span className="font-medium">Credit/Debit Card</span>
                  <span className="text-xs text-muted-foreground mt-1">
                    Visa, Mastercard, Amex
                  </span>
                </Label>
              </div>
              <div>
                <RadioGroupItem
                  value="ach"
                  id="ach"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="ach"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                >
                  <Building2 className="mb-3 h-8 w-8" />
                  <span className="font-medium">Bank Account (ACH)</span>
                  <span className="text-xs text-muted-foreground mt-1">
                    Direct bank transfer
                  </span>
                </Label>
              </div>
            </RadioGroup>

            <div className="rounded-lg bg-muted p-4">
              <h4 className="font-medium mb-2">
                {paymentType === "card" ? "Card Payment" : "ACH Bank Transfer"}
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                {paymentType === "card" ? (
                  <>
                    <li>• Instant processing</li>
                    <li>• Works with most major cards</li>
                    <li>• Secure 3D authentication</li>
                  </>
                ) : (
                  <>
                    <li>• Lower processing fees</li>
                    <li>• Direct from your bank account</li>
                    <li>• Takes 3-5 business days to process</li>
                  </>
                )}
              </ul>
            </div>

            <Button 
              onClick={createSetupIntent} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Setting up...
                </>
              ) : (
                `Continue with ${paymentType === "card" ? "Card" : "Bank Account"}`
              )}
            </Button>
          </>
        ) : (
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret,
              appearance: {
                theme: "stripe",
                variables: {
                  colorPrimary: "#1a1a2e",
                },
              },
            }}
          >
            <PaymentMethodSetupForm onPaymentMethodSaved={handlePaymentMethodSaved} />
          </Elements>
        )}
      </CardContent>
    </Card>
  );
}
