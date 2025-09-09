-- Create function to get correct options for a quiz after user has submitted an attempt
CREATE OR REPLACE FUNCTION public.get_correct_options_for_quiz(p_quiz_id uuid)
RETURNS TABLE(question_id uuid, option_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Check if user has completed an attempt for this quiz
  IF NOT EXISTS (
    SELECT 1 
    FROM quiz_attempts qa
    JOIN employees e ON qa.employee_id = e.id
    WHERE qa.quiz_id = p_quiz_id 
      AND e.email = (auth.jwt() ->> 'email'::text)
  ) THEN
    RAISE EXCEPTION 'No quiz attempt found for this user and quiz';
  END IF;
  
  -- Return correct option IDs for the quiz
  RETURN QUERY
  SELECT 
    qq.id as question_id,
    qo.id as option_id
  FROM quiz_questions qq
  JOIN quiz_question_options qo ON qq.id = qo.question_id
  WHERE qq.quiz_id = p_quiz_id
    AND qo.is_correct = true
  ORDER BY qq.order_index, qo.order_index;
END;
$function$