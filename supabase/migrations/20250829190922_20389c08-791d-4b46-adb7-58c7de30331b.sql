-- Update handle_new_user to prevent creating employees for admins
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  admin_emails TEXT[] := ARRAY[
    'admin@gmail.com',
    'admin@seniorservices.com', 
    'manager@seniorservices.com',
    'jeri.vibe.test@gmail.com'
  ];
  user_role app_role := 'employee';
BEGIN
  -- If pre-approved in pending_admins, make them admin immediately
  IF EXISTS (SELECT 1 FROM public.pending_admins WHERE lower(email) = lower(NEW.email)) THEN
    user_role := 'admin';
    DELETE FROM public.pending_admins WHERE lower(email) = lower(NEW.email);
  ELSIF NEW.email = ANY(admin_emails) THEN
    user_role := 'admin';
  END IF;

  -- Insert profile (handle conflicts)
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name')
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Only add to employees table if role is employee
  IF user_role = 'employee' THEN
    INSERT INTO public.employees (email, full_name)
    VALUES (NEW.email, NEW.raw_user_meta_data->>'full_name')
    ON CONFLICT (email) DO NOTHING;
  END IF;
  
  -- Assign appropriate single role (admin or employee)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, user_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$function$;

-- Update promote_user_to_admin to also remove employee record
CREATE OR REPLACE FUNCTION public.promote_user_to_admin(p_user_id uuid, p_email text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Normalize email
  p_email := lower(p_email);

  -- Remove any existing employee role
  DELETE FROM public.user_roles 
  WHERE user_id = p_user_id AND role = 'employee';

  -- Remove from employees table if exists (admin should not be an employee)
  DELETE FROM public.employees 
  WHERE lower(email) = p_email;

  -- Grant admin role
  INSERT INTO public.user_roles(user_id, role)
  VALUES (p_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Remove from pending admins if present
  DELETE FROM public.pending_admins WHERE lower(email) = p_email;
END;
$function$;

-- One-time cleanup: remove employees that belong to admin users
DELETE FROM public.employees e
USING public.profiles p, public.user_roles ur
WHERE lower(e.email) = lower(p.email)
  AND ur.user_id = p.user_id
  AND ur.role = 'admin';