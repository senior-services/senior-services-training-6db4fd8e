
-- Add last_position_seconds column
ALTER TABLE video_progress ADD COLUMN last_position_seconds integer DEFAULT 0;

-- Drop and recreate the most complete overload of update_video_progress_by_email to add p_last_position_seconds
CREATE OR REPLACE FUNCTION public.update_video_progress_by_email(
  p_email text,
  p_video_id uuid,
  p_progress_percent integer,
  p_completed_at timestamp with time zone DEFAULT NULL,
  p_presentation_acknowledged_at timestamp with time zone DEFAULT NULL,
  p_acknowledgment_viewing_seconds integer DEFAULT NULL,
  p_furthest_watched_seconds integer DEFAULT NULL,
  p_last_position_seconds integer DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_employee_id uuid;
  v_full_name text;
  v_content_type content_type;
  v_min_seconds integer := 30;
BEGIN
  SELECT id INTO v_employee_id
  FROM public.employees
  WHERE lower(email) = lower(p_email)
  LIMIT 1;

  IF v_employee_id IS NULL THEN
    SELECT full_name INTO v_full_name
    FROM public.profiles
    WHERE lower(email) = lower(p_email)
    LIMIT 1;

    INSERT INTO public.employees (email, full_name)
    VALUES (p_email, v_full_name)
    RETURNING id INTO v_employee_id;
  END IF;

  SELECT content_type INTO v_content_type
  FROM public.videos
  WHERE id = p_video_id;

  IF v_content_type = 'presentation' 
     AND p_presentation_acknowledged_at IS NOT NULL 
     AND (p_acknowledgment_viewing_seconds IS NULL OR p_acknowledgment_viewing_seconds < v_min_seconds) THEN
    RAISE EXCEPTION 'Insufficient viewing time for presentation acknowledgment. Minimum % seconds required.', v_min_seconds;
  END IF;

  INSERT INTO public.video_progress (
    employee_id, video_id, progress_percent, completed_at,
    presentation_acknowledged_at, acknowledgment_viewing_seconds,
    furthest_watched_seconds, last_position_seconds
  )
  VALUES (
    v_employee_id, p_video_id,
    GREATEST(0, LEAST(100, p_progress_percent)),
    p_completed_at, p_presentation_acknowledged_at, p_acknowledgment_viewing_seconds,
    COALESCE(p_furthest_watched_seconds, 0),
    COALESCE(p_last_position_seconds, 0)
  )
  ON CONFLICT (employee_id, video_id) 
  DO UPDATE SET 
    progress_percent = EXCLUDED.progress_percent,
    completed_at = COALESCE(EXCLUDED.completed_at, video_progress.completed_at),
    presentation_acknowledged_at = COALESCE(EXCLUDED.presentation_acknowledged_at, video_progress.presentation_acknowledged_at),
    acknowledgment_viewing_seconds = COALESCE(EXCLUDED.acknowledgment_viewing_seconds, video_progress.acknowledgment_viewing_seconds),
    furthest_watched_seconds = GREATEST(
      COALESCE(EXCLUDED.furthest_watched_seconds, 0),
      COALESCE(video_progress.furthest_watched_seconds, 0)
    ),
    last_position_seconds = COALESCE(EXCLUDED.last_position_seconds, video_progress.last_position_seconds),
    updated_at = now();
END;
$$;
