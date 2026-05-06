-- Backfill email for existing profiles where email is null/empty
-- (accounts created before the handle_new_user trigger was deployed)
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.user_id = u.id
  AND (p.email IS NULL OR p.email = '');
