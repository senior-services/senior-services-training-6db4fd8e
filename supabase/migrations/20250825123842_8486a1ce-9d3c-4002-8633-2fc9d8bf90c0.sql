-- First add a unique constraint on email in employees table to prevent duplicates
ALTER TABLE public.employees ADD CONSTRAINT employees_email_unique UNIQUE (email);

-- Update the handle_new_user function with proper conflict handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Insert profile (handle conflicts)
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name')
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Add user to employees table for admin management (handle conflicts)
  INSERT INTO public.employees (email, full_name)
  VALUES (new.email, new.raw_user_meta_data->>'full_name')
  ON CONFLICT (email) DO NOTHING;
  
  -- Assign default employee role (handle conflicts)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'employee')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN new;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't block user creation
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN new;
END;
$$;