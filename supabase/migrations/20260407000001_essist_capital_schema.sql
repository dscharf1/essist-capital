-- ============================================================
-- Essist Capital — Full Schema Migration
-- ============================================================

-- ── profiles (extends existing) ──────────────────────────────
ALTER TABLE IF EXISTS public.profiles
  ADD COLUMN IF NOT EXISTS date_of_birth DATE,
  ADD COLUMN IF NOT EXISTS borrower_type TEXT CHECK (borrower_type IN ('individual', 'llc')),
  ADD COLUMN IF NOT EXISTS llc_name TEXT,
  ADD COLUMN IF NOT EXISTS ein TEXT,
  ADD COLUMN IF NOT EXISTS years_in_business INTEGER;

-- ── applications ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.applications (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  borrower_type         TEXT NOT NULL CHECK (borrower_type IN ('individual', 'llc')),
  loan_amount           NUMERIC(12,2) NOT NULL,
  term_months           INTEGER NOT NULL CHECK (term_months IN (15, 18, 24)),
  monthly_payment       NUMERIC(12,2) NOT NULL,
  total_repayment       NUMERIC(12,2) NOT NULL,
  origination_fee       NUMERIC(12,2) NOT NULL,
  finance_charge        NUMERIC(12,2) NOT NULL,
  apr                   NUMERIC(6,4) NOT NULL,
  project_type          TEXT NOT NULL,
  project_description   TEXT,
  property_address      TEXT NOT NULL,
  property_city         TEXT NOT NULL,
  property_state        TEXT NOT NULL CHECK (property_state IN ('NJ', 'NY')),
  property_zip          TEXT NOT NULL,
  property_type         TEXT NOT NULL,
  contractor_name       TEXT,
  llc_name              TEXT,
  ein                   TEXT,
  status                TEXT NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending','under_review','approved','rejected','funded','closed')),
  tila_accepted         BOOLEAN NOT NULL DEFAULT false,
  tila_accepted_at      TIMESTAMPTZ,
  esignature_text       TEXT,
  esignature_timestamp  TIMESTAMPTZ,
  admin_notes           TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own applications"
  ON public.applications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own applications"
  ON public.applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can read all applications"
  ON public.applications FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- ── virtual_cards ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.virtual_cards (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id        UUID REFERENCES public.applications(id) ON DELETE CASCADE NOT NULL,
  user_id               UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  card_last_four        TEXT NOT NULL,
  card_expiry_month     INTEGER NOT NULL,
  card_expiry_year      INTEGER NOT NULL,
  credit_limit          NUMERIC(12,2) NOT NULL,
  available_balance     NUMERIC(12,2) NOT NULL,
  drawn_amount          NUMERIC(12,2) NOT NULL DEFAULT 0,
  card_status           TEXT NOT NULL DEFAULT 'inactive'
                          CHECK (card_status IN ('inactive','active','frozen','closed')),
  baselane_account_name TEXT,
  issued_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.virtual_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own virtual cards"
  ON public.virtual_cards FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own virtual cards"
  ON public.virtual_cards FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage virtual cards"
  ON public.virtual_cards FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- ── card_transactions ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.card_transactions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  virtual_card_id  UUID REFERENCES public.virtual_cards(id) ON DELETE CASCADE NOT NULL,
  application_id   UUID REFERENCES public.applications(id) ON DELETE CASCADE NOT NULL,
  user_id          UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  transaction_date DATE NOT NULL,
  merchant_name    TEXT NOT NULL,
  amount           NUMERIC(12,2) NOT NULL,
  category         TEXT,
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.card_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own transactions"
  ON public.card_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage transactions"
  ON public.card_transactions FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- ── payments ─────────────────────────────────────────────────
-- Drop old payments table (different schema — no user_id, tied to repayment_schedules)
DROP TABLE IF EXISTS public.payments CASCADE;

CREATE TABLE public.payments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id  UUID REFERENCES public.applications(id) ON DELETE CASCADE NOT NULL,
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  payment_number  INTEGER NOT NULL,
  due_date        DATE NOT NULL,
  amount_due      NUMERIC(12,2) NOT NULL,
  amount_paid     NUMERIC(12,2),
  status          TEXT NOT NULL DEFAULT 'scheduled'
                    CHECK (status IN ('scheduled','paid','late','missed')),
  paid_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own payments"
  ON public.payments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage payments"
  ON public.payments FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- ── contractor_leads ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.contractor_leads (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,
  company_name     TEXT,
  phone            TEXT NOT NULL,
  email            TEXT NOT NULL,
  license_number   TEXT,
  service_area     TEXT,
  years_in_business INTEGER,
  referral_count   INTEGER NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.contractor_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage contractor leads"
  ON public.contractor_leads FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Anyone can insert contractor leads"
  ON public.contractor_leads FOR INSERT
  WITH CHECK (true);

-- ── documents ─────────────────────────────────────────────────
-- Drop old documents table (different schema — DocuSign-based, no user_id/file_url)
DROP TABLE IF EXISTS public.documents CASCADE;

CREATE TABLE public.documents (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE NOT NULL,
  user_id        UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  document_type  TEXT NOT NULL
                   CHECK (document_type IN ('id','proof_of_income','property_deed','contractor_quote','other')),
  file_url       TEXT NOT NULL,
  file_name      TEXT NOT NULL,
  uploaded_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  verified       BOOLEAN
);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own documents"
  ON public.documents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own documents"
  ON public.documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage documents"
  ON public.documents FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- ── notifications ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type       TEXT NOT NULL,
  title      TEXT NOT NULL,
  message    TEXT NOT NULL,
  read       BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage notifications"
  ON public.notifications FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- ── audit_log ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.audit_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action_type     TEXT NOT NULL,
  target_table    TEXT NOT NULL,
  target_id       UUID,
  old_value       JSONB,
  new_value       JSONB,
  ip_address      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Audit log is read-only for admins; no delete or update permitted
CREATE POLICY "Admins can read audit log"
  ON public.audit_log FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "System can insert audit log"
  ON public.audit_log FOR INSERT
  WITH CHECK (true);

-- ── Auto-update timestamps ────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'applications_updated_at') THEN
    CREATE TRIGGER applications_updated_at
      BEFORE UPDATE ON public.applications
      FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'virtual_cards_updated_at') THEN
    CREATE TRIGGER virtual_cards_updated_at
      BEFORE UPDATE ON public.virtual_cards
      FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
  END IF;
END;
$$;

-- ── Audit log trigger for applications ───────────────────────
CREATE OR REPLACE FUNCTION public.audit_application_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_log (admin_user_id, action_type, target_table, target_id, old_value, new_value)
    VALUES (auth.uid(), 'update', 'applications', NEW.id, row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'applications_audit') THEN
    CREATE TRIGGER applications_audit
      AFTER UPDATE ON public.applications
      FOR EACH ROW EXECUTE FUNCTION public.audit_application_change();
  END IF;
END;
$$;
