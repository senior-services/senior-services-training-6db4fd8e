-- Add archived functionality to employees table (check if columns exist first)
DO $$
BEGIN
  -- Add archived column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'archived') THEN
    ALTER TABLE public.employees ADD COLUMN archived BOOLEAN DEFAULT FALSE;
  END IF;
  
  -- Add archived_at column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'archived_at') THEN
    ALTER TABLE public.employees ADD COLUMN archived_at TIMESTAMP WITH TIME ZONE;
  END IF;
  
  -- Add archived_by column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'archived_by') THEN
    ALTER TABLE public.employees ADD COLUMN archived_by UUID;
  END IF;
END $$;

-- Create indexes for performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_employees_archived ON public.employees(archived) WHERE archived = TRUE;
CREATE INDEX IF NOT EXISTS idx_employees_active ON public.employees(archived, created_at) WHERE (archived = FALSE OR archived IS NULL);
CREATE INDEX IF NOT EXISTS idx_employees_archived_at ON public.employees(archived_at) WHERE archived_at IS NOT NULL;

-- Create function to handle archiving with audit trail
CREATE OR REPLACE FUNCTION public.archive_employee(p_employee_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Check if user has admin role
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Only admins can archive employees';
  END IF;
  
  -- Archive the employee
  UPDATE public.employees 
  SET 
    archived = TRUE,
    archived_at = now(),
    archived_by = auth.uid(),
    updated_at = now()
  WHERE id = p_employee_id AND (archived = FALSE OR archived IS NULL);
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Employee not found or already archived';
  END IF;
END;
$$;

-- Create function to handle unarchiving
CREATE OR REPLACE FUNCTION public.unarchive_employee(p_employee_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Check if user has admin role
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Only admins can unarchive employees';
  END IF;
  
  -- Unarchive the employee
  UPDATE public.employees 
  SET 
    archived = FALSE,
    archived_at = NULL,
    archived_by = NULL,
    updated_at = now()
  WHERE id = p_employee_id AND archived = TRUE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Employee not found or not archived';
  END IF;
END;
$$;