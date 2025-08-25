-- Update the handle_new_user function to also add users to employees table
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  
  -- Add user to employees table for admin management
  INSERT INTO public.employees (email, full_name)
  VALUES (new.email, new.raw_user_meta_data->>'full_name');
  
  -- Assign default employee role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'employee');
  
  RETURN new;
END;
$$;