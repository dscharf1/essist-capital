-- Add payment_type to applications
-- Client chooses at application time: interest_only or principal_and_interest

ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS payment_type TEXT NOT NULL DEFAULT 'principal_and_interest'
    CHECK (payment_type IN ('interest_only', 'principal_and_interest'));
