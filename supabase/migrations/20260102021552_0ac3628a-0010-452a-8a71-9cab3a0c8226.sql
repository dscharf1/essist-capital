-- Workflow status enum
CREATE TYPE public.application_status AS ENUM (
  'draft',
  'submitted', 
  'document_sent',
  'document_signed',
  'card_provisioned',
  'project_started',
  'inspection_pending',
  'inspection_passed',
  'funds_released',
  'completed',
  'rejected'
);

-- Loan applications table
CREATE TABLE public.loan_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  project_type TEXT NOT NULL,
  project_description TEXT,
  requested_amount DECIMAL(10,2) NOT NULL,
  contractor_id UUID,
  status public.application_status NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Card allocations table (simulated card provisioning)
CREATE TABLE public.card_allocations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID NOT NULL REFERENCES public.loan_applications(id) ON DELETE CASCADE,
  card_number_masked TEXT NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  materials_amount DECIMAL(10,2) NOT NULL,
  labor_amount DECIMAL(10,2) NOT NULL,
  materials_unlocked BOOLEAN NOT NULL DEFAULT true,
  labor_unlocked BOOLEAN NOT NULL DEFAULT false,
  merchant_category_lock TEXT[] DEFAULT ARRAY['home_improvement', 'building_materials', 'hardware_stores'],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- DocuSign simulated documents
CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID NOT NULL REFERENCES public.loan_applications(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMP WITH TIME ZONE,
  signed_at TIMESTAMP WITH TIME ZONE,
  envelope_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Inspections table
CREATE TABLE public.inspections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID NOT NULL REFERENCES public.loan_applications(id) ON DELETE CASCADE,
  inspector_name TEXT,
  scheduled_date TIMESTAMP WITH TIME ZONE,
  completed_date TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  passed BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Workflow events log for tracking all actions
CREATE TABLE public.workflow_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID NOT NULL REFERENCES public.loan_applications(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_data JSONB,
  triggered_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.loan_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_events ENABLE ROW LEVEL SECURITY;

-- Public read/write policies for demo (applications can be created by anyone)
CREATE POLICY "Anyone can create applications"
ON public.loan_applications FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can view applications by email"
ON public.loan_applications FOR SELECT
USING (true);

CREATE POLICY "Anyone can update applications"
ON public.loan_applications FOR UPDATE
USING (true);

-- Card allocations policies
CREATE POLICY "Anyone can view card allocations"
ON public.card_allocations FOR SELECT
USING (true);

CREATE POLICY "System can create card allocations"
ON public.card_allocations FOR INSERT
WITH CHECK (true);

CREATE POLICY "System can update card allocations"
ON public.card_allocations FOR UPDATE
USING (true);

-- Documents policies
CREATE POLICY "Anyone can view documents"
ON public.documents FOR SELECT
USING (true);

CREATE POLICY "System can create documents"
ON public.documents FOR INSERT
WITH CHECK (true);

CREATE POLICY "System can update documents"
ON public.documents FOR UPDATE
USING (true);

-- Inspections policies
CREATE POLICY "Anyone can view inspections"
ON public.inspections FOR SELECT
USING (true);

CREATE POLICY "System can create inspections"
ON public.inspections FOR INSERT
WITH CHECK (true);

CREATE POLICY "System can update inspections"
ON public.inspections FOR UPDATE
USING (true);

-- Workflow events policies
CREATE POLICY "Anyone can view workflow events"
ON public.workflow_events FOR SELECT
USING (true);

CREATE POLICY "System can create workflow events"
ON public.workflow_events FOR INSERT
WITH CHECK (true);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_loan_applications_updated_at
BEFORE UPDATE ON public.loan_applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();