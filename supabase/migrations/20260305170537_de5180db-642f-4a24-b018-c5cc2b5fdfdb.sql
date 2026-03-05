
-- Quiz draft responses table for in-progress quiz saving
CREATE TABLE public.quiz_draft_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  quiz_id uuid NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  responses jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (employee_id, quiz_id)
);

ALTER TABLE public.quiz_draft_responses ENABLE ROW LEVEL SECURITY;

-- RLS: employees can manage their own drafts
CREATE POLICY "Employees can manage their own drafts"
ON public.quiz_draft_responses
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.employees e
    WHERE e.id = quiz_draft_responses.employee_id
      AND e.email = (auth.jwt() ->> 'email'::text)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.employees e
    WHERE e.id = quiz_draft_responses.employee_id
      AND e.email = (auth.jwt() ->> 'email'::text)
  )
);

-- RLS: admins can view all drafts
CREATE POLICY "Admins can manage all drafts"
ON public.quiz_draft_responses
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- updated_at trigger
CREATE TRIGGER update_quiz_draft_responses_updated_at
  BEFORE UPDATE ON public.quiz_draft_responses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Upsert quiz draft (SECURITY DEFINER to resolve employee_id from email)
CREATE OR REPLACE FUNCTION public.upsert_quiz_draft(
  p_email text,
  p_quiz_id uuid,
  p_responses jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_employee_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Verify caller's email matches
  IF lower(p_email) <> lower(auth.jwt() ->> 'email'::text) THEN
    IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
      RAISE EXCEPTION 'Not authorized';
    END IF;
  END IF;

  SELECT id INTO v_employee_id
  FROM public.employees
  WHERE lower(email) = lower(p_email)
  LIMIT 1;

  IF v_employee_id IS NULL THEN
    RAISE EXCEPTION 'Employee not found';
  END IF;

  INSERT INTO public.quiz_draft_responses (employee_id, quiz_id, responses)
  VALUES (v_employee_id, p_quiz_id, p_responses)
  ON CONFLICT (employee_id, quiz_id)
  DO UPDATE SET responses = EXCLUDED.responses, updated_at = now();
END;
$$;

-- Get quiz draft
CREATE OR REPLACE FUNCTION public.get_quiz_draft(
  p_email text,
  p_quiz_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_employee_id uuid;
  v_responses jsonb;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF lower(p_email) <> lower(auth.jwt() ->> 'email'::text) THEN
    IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
      RAISE EXCEPTION 'Not authorized';
    END IF;
  END IF;

  SELECT id INTO v_employee_id
  FROM public.employees
  WHERE lower(email) = lower(p_email)
  LIMIT 1;

  IF v_employee_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT responses INTO v_responses
  FROM public.quiz_draft_responses
  WHERE employee_id = v_employee_id AND quiz_id = p_quiz_id;

  RETURN v_responses;
END;
$$;

-- Delete quiz draft
CREATE OR REPLACE FUNCTION public.delete_quiz_draft(
  p_email text,
  p_quiz_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_employee_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF lower(p_email) <> lower(auth.jwt() ->> 'email'::text) THEN
    IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
      RAISE EXCEPTION 'Not authorized';
    END IF;
  END IF;

  SELECT id INTO v_employee_id
  FROM public.employees
  WHERE lower(email) = lower(p_email)
  LIMIT 1;

  IF v_employee_id IS NULL THEN
    RETURN;
  END IF;

  DELETE FROM public.quiz_draft_responses
  WHERE employee_id = v_employee_id AND quiz_id = p_quiz_id;
END;
$$;
