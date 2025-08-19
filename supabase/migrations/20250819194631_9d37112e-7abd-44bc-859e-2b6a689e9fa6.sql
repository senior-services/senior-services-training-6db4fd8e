-- Fix security issues from previous migration

-- Drop the view and recreate without SECURITY DEFINER
DROP VIEW IF EXISTS public.employee_assignments_with_videos;

-- Update functions to set search_path for security
CREATE OR REPLACE FUNCTION public.extract_domain_from_email(email_address TEXT)
RETURNS TEXT
LANGUAGE SQL
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT split_part(email_address, '@', 2);
$$;

CREATE OR REPLACE FUNCTION public.set_employee_domain()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.email IS NOT NULL THEN
        NEW.domain = public.extract_domain_from_email(NEW.email);
    END IF;
    RETURN NEW;
END;
$$;

-- Recreate the view as a regular view (not SECURITY DEFINER)
CREATE VIEW public.employee_assignments_with_videos AS
SELECT 
    va.id as assignment_id,
    va.employee_id,
    va.video_id,
    va.assigned_by,
    va.created_at as assigned_at,
    e.email as employee_email,
    e.full_name as employee_name,
    e.domain as employee_domain,
    e.is_generic as is_generic_assignment,
    v.title as video_title,
    v.description as video_description,
    v.video_url,
    v.thumbnail_url,
    v.type as video_type
FROM public.video_assignments va
JOIN public.employees e ON va.employee_id = e.id
JOIN public.videos v ON va.video_id = v.id;