CREATE OR REPLACE FUNCTION public.get_user_video_assignments(user_email text)
 RETURNS TABLE(video json, assignment json)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY

  -- Source 1: videos with formal assignments
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
  WHERE e.email = user_email

  UNION ALL

  -- Source 2: completed/in-progress videos WITHOUT a formal assignment
  SELECT 
    row_to_json(v2.*) as video,
    json_build_object(
      'due_date', NULL,
      'assigned_at', vp2.created_at,
      'assignment_id', NULL,
      'progress_percent', vp2.progress_percent,
      'completed_at', vp2.completed_at
    ) as assignment
  FROM video_progress vp2
  JOIN videos v2 ON vp2.video_id = v2.id
  JOIN employees e2 ON vp2.employee_id = e2.id
  WHERE e2.email = user_email
    AND NOT EXISTS (
      SELECT 1 FROM video_assignments va2
      WHERE va2.employee_id = e2.id AND va2.video_id = vp2.video_id
    );
END;
$function$;