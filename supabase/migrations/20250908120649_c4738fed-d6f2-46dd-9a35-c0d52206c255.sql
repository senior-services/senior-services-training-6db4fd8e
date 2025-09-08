-- Remove the vulnerable RLS policy that allows employees to see correct answers
DROP POLICY IF EXISTS "Employees can view quiz question options" ON public.quiz_question_options;

-- Create a security definer function that returns safe quiz options for employees
CREATE OR REPLACE FUNCTION public.get_safe_quiz_options(p_question_id uuid)
RETURNS TABLE(
  id uuid,
  question_id uuid,
  option_text text,
  order_index integer,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Return quiz options without the is_correct field
  RETURN QUERY
  SELECT 
    qo.id,
    qo.question_id,
    qo.option_text,
    qo.order_index,
    qo.created_at,
    qo.updated_at
  FROM quiz_question_options qo
  WHERE qo.question_id = p_question_id
  ORDER BY qo.order_index;
END;
$$;