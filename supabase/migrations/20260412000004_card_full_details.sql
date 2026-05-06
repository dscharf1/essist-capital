-- Add full card details so borrowers can use the virtual card anywhere
ALTER TABLE public.virtual_cards
  ADD COLUMN IF NOT EXISTS card_number   TEXT,        -- full 16-digit PAN (entered by admin from Baselane)
  ADD COLUMN IF NOT EXISTS card_cvv      TEXT,        -- 3-digit CVV
  ADD COLUMN IF NOT EXISTS billing_zip   TEXT;        -- billing ZIP for card-not-present use
