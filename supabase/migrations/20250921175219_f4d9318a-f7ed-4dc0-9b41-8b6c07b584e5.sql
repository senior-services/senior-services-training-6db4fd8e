-- Create function to check video usage for deletion validation
CREATE OR REPLACE FUNCTION check_video_usage(video_id uuid)
RETURNS TABLE(assigned_count bigint, completed_count bigint, quiz_completed_count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(COUNT(DISTINCT va.employee_id), 0) as assigned_count,
    COALESCE(COUNT(DISTINCT vp.employee_id) FILTER (WHERE vp.completed_at IS NOT NULL), 0) as completed_count,
    COALESCE(COUNT(DISTINCT qa.employee_id), 0) as quiz_completed_count
  FROM videos v
  LEFT JOIN video_assignments va ON v.id = va.video_id
  LEFT JOIN video_progress vp ON v.id = vp.video_id 
  LEFT JOIN quizzes q ON v.id = q.video_id
  LEFT JOIN quiz_attempts qa ON q.id = qa.quiz_id
  WHERE v.id = video_id;
END;
$$;

-- Create function to check quiz usage for deletion validation
CREATE OR REPLACE FUNCTION check_quiz_usage(quiz_id uuid)
RETURNS TABLE(attempt_count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(COUNT(DISTINCT qa.employee_id), 0) as attempt_count
  FROM quizzes q
  LEFT JOIN quiz_attempts qa ON q.id = qa.quiz_id
  WHERE q.id = quiz_id;
END;
$$;