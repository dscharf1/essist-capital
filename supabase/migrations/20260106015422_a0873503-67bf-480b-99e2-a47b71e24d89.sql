-- Create payment_methods table to store user payment preferences
CREATE TABLE public.payment_methods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  application_id UUID REFERENCES public.loan_applications(id),
  stripe_customer_id TEXT NOT NULL,
  stripe_payment_method_id TEXT,
  payment_type TEXT NOT NULL CHECK (payment_type IN ('card', 'ach')),
  last_four TEXT,
  brand TEXT,
  bank_name TEXT,
  is_default BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create repayment_schedules table for monthly payment tracking
CREATE TABLE public.repayment_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID NOT NULL REFERENCES public.loan_applications(id),
  payment_method_id UUID REFERENCES public.payment_methods(id),
  monthly_amount NUMERIC NOT NULL,
  total_amount NUMERIC NOT NULL,
  remaining_balance NUMERIC NOT NULL,
  next_payment_date DATE NOT NULL,
  payments_made INTEGER DEFAULT 0,
  total_payments INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'defaulted', 'paused')),
  reminder_7_day_sent BOOLEAN DEFAULT false,
  reminder_3_day_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create payments table for individual payment records
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  schedule_id UUID NOT NULL REFERENCES public.repayment_schedules(id),
  application_id UUID NOT NULL REFERENCES public.loan_applications(id),
  amount NUMERIC NOT NULL,
  stripe_payment_intent_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'succeeded', 'failed', 'refunded')),
  payment_date DATE NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE,
  failure_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repayment_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- RLS policies for payment_methods
CREATE POLICY "Users can view their own payment methods"
  ON public.payment_methods FOR SELECT
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can create their own payment methods"
  ON public.payment_methods FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payment methods"
  ON public.payment_methods FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS policies for repayment_schedules
CREATE POLICY "Users can view their own schedules"
  ON public.repayment_schedules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.loan_applications la
      WHERE la.id = application_id AND (la.user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
    )
  );

CREATE POLICY "System can manage schedules"
  ON public.repayment_schedules FOR ALL
  USING (true)
  WITH CHECK (true);

-- RLS policies for payments
CREATE POLICY "Users can view their own payments"
  ON public.payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.loan_applications la
      WHERE la.id = application_id AND (la.user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
    )
  );

CREATE POLICY "System can manage payments"
  ON public.payments FOR ALL
  USING (true)
  WITH CHECK (true);

-- Add triggers for updated_at
CREATE TRIGGER update_payment_methods_updated_at
  BEFORE UPDATE ON public.payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_repayment_schedules_updated_at
  BEFORE UPDATE ON public.repayment_schedules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();