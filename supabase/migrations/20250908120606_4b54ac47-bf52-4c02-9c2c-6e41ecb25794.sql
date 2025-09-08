-- Remove the vulnerable RLS policy that allows employees to see correct answers
DROP POLICY IF EXISTS "Employees can view quiz question options" ON public.quiz_question_options;

-- Create a safe view for employees that excludes the is_correct field
CREATE OR REPLACE VIEW public.quiz_question_options_safe AS
SELECT 
  id,
  question_id,
  option_text,
  order_index,
  created_at,
  updated_at
FROM public.quiz_question_options;

-- Enable RLS on the safe view
ALTER VIEW public.quiz_question_options_safe SET (security_invoker = on);

-- Create RLS policies for the safe view
CREATE POLICY "Employees can view safe quiz question options" 
ON public.quiz_question_options_safe
FOR SELECT 
USING (has_role(auth.uid(), 'employee'::app_role));

CREATE POLICY "Admins can view safe quiz question options" 
ON public.quiz_question_options_safe
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));