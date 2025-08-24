-- Add completion tracking table
CREATE TABLE public.video_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  progress_percent INTEGER NOT NULL DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(employee_id, video_id)
);

-- Enable RLS
ALTER TABLE public.video_progress ENABLE ROW LEVEL SECURITY;

-- Create policies for video progress
CREATE POLICY "Admins can manage all video progress" 
ON public.video_progress 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Employees can view their own progress" 
ON public.video_progress 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM employees e 
    WHERE e.id = video_progress.employee_id 
    AND e.email = (auth.jwt() ->> 'email'::text)
  )
);

CREATE POLICY "Employees can update their own progress" 
ON public.video_progress 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM employees e 
    WHERE e.id = video_progress.employee_id 
    AND e.email = (auth.jwt() ->> 'email'::text)
  )
);

CREATE POLICY "Employees can update their own progress records" 
ON public.video_progress 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM employees e 
    WHERE e.id = video_progress.employee_id 
    AND e.email = (auth.jwt() ->> 'email'::text)
  )
);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_video_progress_updated_at
BEFORE UPDATE ON public.video_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add unique constraint to video_assignments to prevent duplicates
ALTER TABLE public.video_assignments 
ADD CONSTRAINT unique_video_employee UNIQUE(video_id, employee_id);

-- Create optimized function for batch employee assignment loading
CREATE OR REPLACE FUNCTION public.get_all_employee_assignments()
RETURNS TABLE (
  employee_id UUID,
  employee_email TEXT,
  employee_full_name TEXT,
  assignments JSON
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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
  GROUP BY e.id, e.email, e.full_name
  ORDER BY e.created_at DESC;
END;
$$;

-- Create function to update video progress
CREATE OR REPLACE FUNCTION public.update_video_progress(
  p_employee_id UUID,
  p_video_id UUID,
  p_progress_percent INTEGER,
  p_completed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO video_progress (employee_id, video_id, progress_percent, completed_at)
  VALUES (p_employee_id, p_video_id, p_progress_percent, p_completed_at)
  ON CONFLICT (employee_id, video_id) 
  DO UPDATE SET 
    progress_percent = EXCLUDED.progress_percent,
    completed_at = EXCLUDED.completed_at,
    updated_at = now();
END;
$$;

-- Update the existing get_user_video_assignments function to include progress
CREATE OR REPLACE FUNCTION public.get_user_video_assignments(user_email text)
RETURNS TABLE(video json, assignment json)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    row_to_json(v.*) as video,
    json_build_object(
      'due_date', va.due_date,
      'assigned_at', va.created_at,
      'assignment_id', va.id,
      'progress_percent', COALESCE(vp.progress_percent, 0),
      'completed_at', vp.completed_at
    ) as assignment
  FROM video_assignments va
  JOIN videos v ON va.video_id = v.id
  JOIN employees e ON va.employee_id = e.id
  LEFT JOIN video_progress vp ON (e.id = vp.employee_id AND va.video_id = vp.video_id)
  WHERE e.email = user_email;
END;
$$;