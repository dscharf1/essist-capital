-- Add payment phase to virtual_cards
-- draw_period = interest-only payments until fully drawn
-- repayment   = full principal + interest payments

ALTER TABLE public.virtual_cards
  ADD COLUMN IF NOT EXISTS payment_phase TEXT NOT NULL DEFAULT 'draw_period'
    CHECK (payment_phase IN ('draw_period', 'repayment')),
  ADD COLUMN IF NOT EXISTS repayment_started_at TIMESTAMPTZ;
