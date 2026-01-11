-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Anyone can view workflow events" ON public.workflow_events;

-- Create a new restrictive SELECT policy that only allows:
-- 1. Users who own the associated loan application
-- 2. Admin users
CREATE POLICY "Users can view their own workflow events"
ON public.workflow_events
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.loan_applications la
    WHERE la.id = workflow_events.application_id
      AND (
        la.user_id = auth.uid()
        OR has_role(auth.uid(), 'admin')
      )
  )
);