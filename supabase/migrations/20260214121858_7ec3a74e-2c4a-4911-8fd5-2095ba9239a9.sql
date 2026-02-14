
-- 1. Add is_admin column to employees (may already exist from partial migration)
DO $$ BEGIN
  ALTER TABLE public.employees ADD COLUMN is_admin boolean NOT NULL DEFAULT false;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- 2. Backfill: insert missing admin users into employees
INSERT INTO public.employees (email, full_name, is_admin)
SELECT p.email, p.full_name, true
FROM public.user_roles ur
JOIN public.profiles p ON ur.user_id = p.user_id
WHERE ur.role = 'admin'
  AND NOT EXISTS (
    SELECT 1 FROM public.employees e WHERE lower(e.email) = lower(p.email)
  )
ON CONFLICT (email) DO UPDATE SET is_admin = true;

-- 3. Backfill: mark existing employee rows that are also admins
UPDATE public.employees e
SET is_admin = true
FROM public.user_roles ur
JOIN public.profiles p ON ur.user_id = p.user_id
WHERE lower(e.email) = lower(p.email)
  AND ur.role = 'admin';

-- 4. Update handle_new_user()
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
  IF EXISTS (SELECT 1 FROM public.pending_admins WHERE lower(email) = lower(NEW.email)) THEN
    user_role := 'admin';
    DELETE FROM public.pending_admins WHERE lower(email) = lower(NEW.email);
  ELSIF NEW.email = ANY(admin_emails) THEN
    user_role := 'admin';
  END IF;

  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name')
  ON CONFLICT (user_id) DO NOTHING;
  
  INSERT INTO public.employees (email, full_name, is_admin)
  VALUES (NEW.email, NEW.raw_user_meta_data->>'full_name', user_role = 'admin')
  ON CONFLICT (email) DO UPDATE
    SET full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), employees.full_name),
        is_admin = EXCLUDED.is_admin;
  
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

-- 5. Update promote_user_to_admin()
CREATE OR REPLACE FUNCTION public.promote_user_to_admin(p_user_id uuid, p_email text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  p_email := lower(p_email);

  DELETE FROM public.user_roles 
  WHERE user_id = p_user_id AND role = 'employee';

  UPDATE public.employees SET is_admin = true WHERE lower(email) = p_email;
  
  INSERT INTO public.employees (email, is_admin)
  VALUES (p_email, true)
  ON CONFLICT (email) DO UPDATE SET is_admin = true;

  INSERT INTO public.user_roles(user_id, role)
  VALUES (p_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  DELETE FROM public.pending_admins WHERE lower(email) = p_email;
END;
$function$;

-- 6. Drop and recreate get_all_employee_assignments with new return type
DROP FUNCTION IF EXISTS public.get_all_employee_assignments();
CREATE OR REPLACE FUNCTION public.get_all_employee_assignments()
 RETURNS TABLE(employee_id uuid, employee_email text, employee_full_name text, is_admin boolean, assignments json)
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
    e.is_admin,
    COALESCE(
      json_agg(row_data ORDER BY row_data->>'video_title'),
      '[]'::json
    ) as assignments
  FROM employees e
  LEFT JOIN LATERAL (
    SELECT json_build_object(
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
    ) as row_data
    FROM video_assignments va
    JOIN videos v ON va.video_id = v.id
    LEFT JOIN video_progress vp ON va.video_id = vp.video_id AND va.employee_id = vp.employee_id
    WHERE va.employee_id = e.id
    UNION ALL
    SELECT json_build_object(
      'assignment_id', NULL,
      'video_id', v2.id,
      'video_title', v2.title,
      'video_description', v2.description,
      'video_type', v2.type,
      'due_date', NULL,
      'assigned_at', vp2.created_at,
      'assigned_by', NULL,
      'progress_percent', vp2.progress_percent,
      'completed_at', vp2.completed_at
    ) as row_data
    FROM video_progress vp2
    JOIN videos v2 ON vp2.video_id = v2.id
    WHERE vp2.employee_id = e.id
      AND NOT EXISTS (
        SELECT 1 FROM video_assignments va2
        WHERE va2.employee_id = e.id AND va2.video_id = vp2.video_id
      )
  ) sub ON true
  WHERE e.archived_at IS NULL
  GROUP BY e.id, e.email, e.full_name, e.is_admin;
END;
$function$;

-- 7. Drop and recreate get_hidden_employee_assignments with new return type
DROP FUNCTION IF EXISTS public.get_hidden_employee_assignments();
CREATE OR REPLACE FUNCTION public.get_hidden_employee_assignments()
 RETURNS TABLE(employee_id uuid, employee_email text, employee_full_name text, is_admin boolean, archived_at timestamp with time zone, assignments json)
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
    e.is_admin,
    e.archived_at,
    COALESCE(
      json_agg(row_data ORDER BY row_data->>'video_title'),
      '[]'::json
    ) as assignments
  FROM employees e
  LEFT JOIN LATERAL (
    SELECT json_build_object(
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
    ) as row_data
    FROM video_assignments va
    JOIN videos v ON va.video_id = v.id
    LEFT JOIN video_progress vp ON va.video_id = vp.video_id AND va.employee_id = vp.employee_id
    WHERE va.employee_id = e.id
    UNION ALL
    SELECT json_build_object(
      'assignment_id', NULL,
      'video_id', v2.id,
      'video_title', v2.title,
      'video_description', v2.description,
      'video_type', v2.type,
      'due_date', NULL,
      'assigned_at', vp2.created_at,
      'assigned_by', NULL,
      'progress_percent', vp2.progress_percent,
      'completed_at', vp2.completed_at
    ) as row_data
    FROM video_progress vp2
    JOIN videos v2 ON vp2.video_id = v2.id
    WHERE vp2.employee_id = e.id
      AND NOT EXISTS (
        SELECT 1 FROM video_assignments va2
        WHERE va2.employee_id = e.id AND va2.video_id = vp2.video_id
      )
  ) sub ON true
  WHERE e.archived_at IS NOT NULL
  GROUP BY e.id, e.email, e.full_name, e.is_admin, e.archived_at
  ORDER BY e.archived_at DESC;
END;
$function$;
