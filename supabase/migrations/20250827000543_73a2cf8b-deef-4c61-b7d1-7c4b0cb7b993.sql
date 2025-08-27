-- First, clean up any existing duplicate roles (keep admin over employee)
DELETE FROM public.user_roles 
WHERE user_id IN (
  SELECT user_id 
  FROM public.user_roles 
  GROUP BY user_id 
  HAVING COUNT(*) > 1
) AND role = 'employee'::app_role
AND user_id IN (
  SELECT user_id 
  FROM public.user_roles 
  WHERE role = 'admin'::app_role
);

-- Update handle_new_user function to check for admin emails first
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
    'manager@seniorservices.com'
  ];
  user_role app_role := 'employee';
BEGIN
  -- Check if this email should be admin
  IF NEW.email = ANY(admin_emails) THEN
    user_role := 'admin';
  END IF;

  -- Insert profile (handle conflicts)
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name')
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Add user to employees table for admin management (handle conflicts)
  INSERT INTO public.employees (email, full_name)
  VALUES (new.email, new.raw_user_meta_data->>'full_name')
  ON CONFLICT (email) DO NOTHING;
  
  -- Assign appropriate role (admin or employee, not both)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, user_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN new;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't block user creation
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN new;
END;
$function$;

-- Remove the separate assign_admin_role function since it's now handled in handle_new_user
DROP FUNCTION IF EXISTS public.assign_admin_role();