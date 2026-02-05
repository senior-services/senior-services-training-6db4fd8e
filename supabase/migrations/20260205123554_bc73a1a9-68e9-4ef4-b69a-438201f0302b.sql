-- Add archived_at column to employees table for soft-delete (hide) functionality
ALTER TABLE public.employees ADD COLUMN archived_at TIMESTAMPTZ DEFAULT NULL;

-- Add index for efficient filtering of archived employees
CREATE INDEX idx_employees_archived_at ON public.employees(archived_at);

-- Update get_all_employee_assignments function to filter out archived employees
CREATE OR REPLACE FUNCTION public.get_all_employee_assignments()
RETURNS TABLE(
  employee_id uuid,
  employee_email text,
  employee_full_name text,
  assignments json
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
          'video_id', v.id,
          'video_title', v.title,
          'video_description', v.description,
          'video_type', v.type,
          'due_date', va.due_date,
          'assigned_at', va.created_at,
          'assigned_by', va.assigned_by,
          'progress_percent', COALESCE(vp.progress_percent, 0),
          'completed_at', vp.completed_at
        )
      ) FILTER (WHERE va.id IS NOT NULL),
      '[]'::json
    ) as assignments
  FROM employees e
  LEFT JOIN video_assignments va ON e.id = va.employee_id
  LEFT JOIN videos v ON va.video_id = v.id AND v.archived_at IS NULL
  LEFT JOIN video_progress vp ON va.video_id = vp.video_id AND va.employee_id = vp.employee_id
  WHERE e.archived_at IS NULL
  GROUP BY e.id, e.email, e.full_name;
END;
$$;

-- Create function to get hidden (archived) employees with their assignments
CREATE OR REPLACE FUNCTION public.get_hidden_employee_assignments()
RETURNS TABLE(
  employee_id uuid,
  employee_email text,
  employee_full_name text,
  archived_at timestamptz,
  assignments json
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id as employee_id,
    e.email as employee_email,
    e.full_name as employee_full_name,
    e.archived_at,
    COALESCE(
      json_agg(
        json_build_object(
          'assignment_id', va.id,
          'video_id', v.id,
          'video_title', v.title,
          'video_description', v.description,
          'video_type', v.type,
          'due_date', va.due_date,
          'assigned_at', va.created_at,
          'assigned_by', va.assigned_by,
          'progress_percent', COALESCE(vp.progress_percent, 0),
          'completed_at', vp.completed_at
        )
      ) FILTER (WHERE va.id IS NOT NULL),
      '[]'::json
    ) as assignments
  FROM employees e
  LEFT JOIN video_assignments va ON e.id = va.employee_id
  LEFT JOIN videos v ON va.video_id = v.id
  LEFT JOIN video_progress vp ON va.video_id = vp.video_id AND va.employee_id = vp.employee_id
  WHERE e.archived_at IS NOT NULL
  GROUP BY e.id, e.email, e.full_name, e.archived_at
  ORDER BY e.archived_at DESC;
END;
$$;