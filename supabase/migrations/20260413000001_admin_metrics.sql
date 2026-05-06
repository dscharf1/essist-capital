-- Admin metrics table for manually tracking funded/collected amounts
CREATE TABLE IF NOT EXISTS public.admin_metrics (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  total_funded    NUMERIC DEFAULT 0,
  total_collected NUMERIC DEFAULT 0,
  notes           TEXT,
  updated_at      TIMESTAMPTZ DEFAULT now(),
  updated_by      UUID REFERENCES auth.users(id)
);

ALTER TABLE public.admin_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage metrics"
  ON public.admin_metrics FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Seed one row
INSERT INTO public.admin_metrics (total_funded, total_collected)
VALUES (0, 0)
ON CONFLICT DO NOTHING;
