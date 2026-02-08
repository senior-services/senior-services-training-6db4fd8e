
-- Phase 1: Quiz Versioning - Add columns, backfill, create function, update RLS

-- 1. Add new columns to quizzes table
ALTER TABLE public.quizzes
  ADD COLUMN version integer NOT NULL DEFAULT 1,
  ADD COLUMN version_group_id uuid NOT NULL DEFAULT gen_random_uuid(),
  ADD COLUMN archived_at timestamptz NULL,
  ADD COLUMN created_by uuid NULL REFERENCES auth.users(id),
  ADD COLUMN updated_by uuid NULL REFERENCES auth.users(id);

-- 2. Backfill existing quizzes: each gets version=1 and a unique version_group_id (already defaulted)
-- The defaults handle this automatically for existing rows since we used NOT NULL DEFAULT

-- 3. Add indexes for efficient lookups
CREATE INDEX idx_quizzes_version_group ON public.quizzes (version_group_id, version);
CREATE INDEX idx_quizzes_video_archived ON public.quizzes (video_id, archived_at);

-- 4. Update RLS: Replace employee SELECT policy to only show active (non-archived) quizzes
DROP POLICY IF EXISTS "Employees can view quizzes" ON public.quizzes;
CREATE POLICY "Employees can view active quizzes"
  ON public.quizzes
  FOR SELECT
  USING (has_role(auth.uid(), 'employee'::app_role) AND archived_at IS NULL);

-- 5. Create the create_quiz_version function
CREATE OR REPLACE FUNCTION public.create_quiz_version(p_quiz_id uuid, p_admin_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_old_quiz RECORD;
  v_new_quiz_id uuid;
  v_new_question_id uuid;
  v_old_question RECORD;
BEGIN
  -- Verify caller is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Verify caller is admin
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Get the current quiz
  SELECT * INTO v_old_quiz FROM quizzes WHERE id = p_quiz_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Quiz not found';
  END IF;

  -- Create new quiz version
  INSERT INTO quizzes (
    video_id, title, description, version_group_id,
    version, created_by, updated_by, archived_at
  ) VALUES (
    v_old_quiz.video_id,
    v_old_quiz.title,
    v_old_quiz.description,
    v_old_quiz.version_group_id,
    v_old_quiz.version + 1,
    p_admin_user_id,
    p_admin_user_id,
    NULL
  ) RETURNING id INTO v_new_quiz_id;

  -- Archive the old quiz
  UPDATE quizzes SET archived_at = now(), updated_by = p_admin_user_id WHERE id = p_quiz_id;

  -- Copy questions and options
  FOR v_old_question IN
    SELECT * FROM quiz_questions WHERE quiz_id = p_quiz_id ORDER BY order_index
  LOOP
    INSERT INTO quiz_questions (quiz_id, question_text, question_type, order_index)
    VALUES (v_new_quiz_id, v_old_question.question_text, v_old_question.question_type, v_old_question.order_index)
    RETURNING id INTO v_new_question_id;

    INSERT INTO quiz_question_options (question_id, option_text, is_correct, order_index)
    SELECT v_new_question_id, option_text, is_correct, order_index
    FROM quiz_question_options
    WHERE question_id = v_old_question.id
    ORDER BY order_index;
  END LOOP;

  RETURN v_new_quiz_id;
END;
$$;
