CREATE OR REPLACE FUNCTION public.get_all_quiz_versions(p_video_id uuid)
RETURNS SETOF quizzes
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY
  SELECT * FROM quizzes
  WHERE video_id = p_video_id
  ORDER BY version ASC;
END;
$$;