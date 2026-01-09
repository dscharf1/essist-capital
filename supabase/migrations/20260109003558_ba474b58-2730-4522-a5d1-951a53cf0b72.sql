-- Create a view for cron job monitoring that admins can access
CREATE OR REPLACE VIEW public.cron_job_status AS
SELECT 
  j.jobid,
  j.jobname,
  j.schedule,
  j.command,
  j.nodename,
  j.nodeport,
  j.database,
  j.username,
  j.active
FROM cron.job j;

-- Create a view for cron job run history
CREATE OR REPLACE VIEW public.cron_job_history AS
SELECT 
  r.runid,
  r.jobid,
  j.jobname,
  r.job_pid,
  r.database,
  r.username,
  r.command,
  r.status,
  r.return_message,
  r.start_time,
  r.end_time
FROM cron.job_run_details r
LEFT JOIN cron.job j ON r.jobid = j.jobid
ORDER BY r.start_time DESC;

-- Grant access to these views
GRANT SELECT ON public.cron_job_status TO authenticated;
GRANT SELECT ON public.cron_job_history TO authenticated;

-- Enable RLS on the views (views inherit from underlying tables but we add policies for safety)
ALTER VIEW public.cron_job_status SET (security_invoker = true);
ALTER VIEW public.cron_job_history SET (security_invoker = true);