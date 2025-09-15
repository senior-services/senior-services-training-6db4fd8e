-- Add archived functionality to employees table with optimizations
ALTER TABLE public.employees 
ADD COLUMN archived BOOLEAN DEFAULT FALSE,
ADD COLUMN archived_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN archived_by UUID;

-- Create indexes for performance
CREATE INDEX idx_employees_archived ON public.employees(archived) WHERE archived = TRUE;
CREATE INDEX idx_employees_active ON public.employees(archived, created_at) WHERE (archived = FALSE OR archived IS NULL);
CREATE INDEX idx_employees_archived_at ON public.employees(archived_at) WHERE archived_at IS NOT NULL;

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

-- Create function to get active employees with assignments
CREATE OR REPLACE FUNCTION public.get_active_employee_assignments()
RETURNS TABLE(employee_id uuid, employee_email text, employee_full_name text, assignments json)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    e.id as employee_id,
    e.email as employee_email,
    e.full_name as employee_full_name,
    COALESCE(
      json_agg(
        json_build_object(
          'assignment_id', va.id,
          'video_id', va.video_id,
          'video_title', v.title,
          'video_description', v.description,
          'video_type', v.type,
          'due_date', va.due_date,
          'assigned_at', va.created_at,
          'assigned_by', va.assigned_by,
          'progress_percent', COALESCE(vp.progress_percent, 0),
          'completed_at', vp.completed_at
        ) ORDER BY va.created_at DESC
      ) FILTER (WHERE va.id IS NOT NULL),
      '[]'::json
    ) as assignments
  FROM employees e
  LEFT JOIN video_assignments va ON e.id = va.employee_id
  LEFT JOIN videos v ON va.video_id = v.id
  LEFT JOIN video_progress vp ON (e.id = vp.employee_id AND va.video_id = vp.video_id)
  WHERE (e.archived = FALSE OR e.archived IS NULL)
  GROUP BY e.id, e.email, e.full_name
  ORDER BY e.created_at DESC;
END;
$function$;

-- Create function to get archived employees
CREATE OR REPLACE FUNCTION public.get_archived_employees()
RETURNS TABLE(employee_id uuid, employee_email text, employee_full_name text, archived_at timestamp with time zone, archived_by uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Check if user has admin role
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Only admins can view archived employees';
  END IF;
  
  RETURN QUERY
  SELECT 
    e.id as employee_id,
    e.email as employee_email,
    e.full_name as employee_full_name,
    e.archived_at,
    e.archived_by
  FROM employees e
  WHERE e.archived = TRUE
  ORDER BY e.archived_at DESC;
END;
$function$;

-- Update RLS policies for archived employees
CREATE POLICY "Admins can view archived employees" 
ON public.employees 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role) AND archived = TRUE);

-- Enable realtime for archived employee changes
ALTER PUBLICATION supabase_realtime ADD TABLE public.employees;