-- Add jeri.vibe.test@gmail.com to allowed admin emails for testing purposes
CREATE OR REPLACE FUNCTION public.enforce_company_domain()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_domain text;
  allowed_admin_emails TEXT[] := ARRAY[
    'admin@gmail.com',
    'admin@seniorservices.com', 
    'manager@seniorservices.com',
    'jeri.vibe.test@gmail.com'
  ];
BEGIN
  IF NEW.email IS NULL THEN
    RAISE EXCEPTION 'Email is required';
  END IF;

  -- Do not enforce on UPDATE operations (e.g., updating last_sign_in during login)
  IF TG_OP = 'UPDATE' THEN
    RETURN NEW;
  END IF;

  v_domain := lower(split_part(NEW.email, '@', 2));

  -- Allow company domain, approved admin emails, or emails present in pending_admins
  IF v_domain <> 'southsoundseniors.org'
     AND lower(NEW.email) <> ALL (allowed_admin_emails)
     AND NOT EXISTS (
       SELECT 1 FROM public.pending_admins pa
       WHERE lower(pa.email) = lower(NEW.email)
     ) THEN
    RAISE EXCEPTION 'Only company email addresses are allowed';
  END IF;

  RETURN NEW;
END;
$function$;