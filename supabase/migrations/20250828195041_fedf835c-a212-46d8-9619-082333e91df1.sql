-- Create table for storing quiz attempts
CREATE TABLE public.quiz_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL,
  quiz_id UUID NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for storing individual quiz responses
CREATE TABLE public.quiz_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_attempt_id UUID NOT NULL,
  question_id UUID NOT NULL,
  selected_option_id UUID NULL, -- For multiple choice questions
  text_answer TEXT NULL, -- For single answer questions
  is_correct BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add foreign key constraints
ALTER TABLE public.quiz_attempts ADD CONSTRAINT fk_quiz_attempts_employee 
  FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;

ALTER TABLE public.quiz_attempts ADD CONSTRAINT fk_quiz_attempts_quiz 
  FOREIGN KEY (quiz_id) REFERENCES public.quizzes(id) ON DELETE CASCADE;

ALTER TABLE public.quiz_responses ADD CONSTRAINT fk_quiz_responses_attempt 
  FOREIGN KEY (quiz_attempt_id) REFERENCES public.quiz_attempts(id) ON DELETE CASCADE;

ALTER TABLE public.quiz_responses ADD CONSTRAINT fk_quiz_responses_question 
  FOREIGN KEY (question_id) REFERENCES public.quiz_questions(id) ON DELETE CASCADE;

ALTER TABLE public.quiz_responses ADD CONSTRAINT fk_quiz_responses_option 
  FOREIGN KEY (selected_option_id) REFERENCES public.quiz_question_options(id) ON DELETE CASCADE;

-- Enable RLS on new tables
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_responses ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for quiz_attempts
CREATE POLICY "Admins can manage all quiz attempts" 
ON public.quiz_attempts 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Employees can view their own quiz attempts" 
ON public.quiz_attempts 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM employees e 
  WHERE e.id = quiz_attempts.employee_id 
  AND e.email = (auth.jwt() ->> 'email')
));

CREATE POLICY "Employees can create their own quiz attempts" 
ON public.quiz_attempts 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM employees e 
  WHERE e.id = quiz_attempts.employee_id 
  AND e.email = (auth.jwt() ->> 'email')
));

-- Create RLS policies for quiz_responses
CREATE POLICY "Admins can manage all quiz responses" 
ON public.quiz_responses 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Employees can view their own quiz responses" 
ON public.quiz_responses 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM quiz_attempts qa
  JOIN employees e ON qa.employee_id = e.id
  WHERE qa.id = quiz_responses.quiz_attempt_id 
  AND e.email = (auth.jwt() ->> 'email')
));

CREATE POLICY "Employees can create their own quiz responses" 
ON public.quiz_responses 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM quiz_attempts qa
  JOIN employees e ON qa.employee_id = e.id
  WHERE qa.id = quiz_responses.quiz_attempt_id 
  AND e.email = (auth.jwt() ->> 'email')
));

-- Add triggers for updated_at columns
CREATE TRIGGER update_quiz_attempts_updated_at
  BEFORE UPDATE ON public.quiz_attempts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_quiz_responses_updated_at
  BEFORE UPDATE ON public.quiz_responses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to submit quiz and calculate score
CREATE OR REPLACE FUNCTION public.submit_quiz_attempt(
  p_employee_email TEXT,
  p_quiz_id UUID,
  p_responses JSONB
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_employee_id UUID;
  v_quiz_attempt_id UUID;
  v_response JSONB;
  v_question_id UUID;
  v_selected_option_id UUID;
  v_text_answer TEXT;
  v_is_correct BOOLEAN;
  v_correct_count INTEGER := 0;
  v_total_questions INTEGER := 0;
BEGIN
  -- Get employee ID
  SELECT id INTO v_employee_id
  FROM employees
  WHERE lower(email) = lower(p_employee_email)
  LIMIT 1;
  
  IF v_employee_id IS NULL THEN
    RAISE EXCEPTION 'Employee not found with email: %', p_employee_email;
  END IF;
  
  -- Get total questions count
  SELECT COUNT(*) INTO v_total_questions
  FROM quiz_questions
  WHERE quiz_id = p_quiz_id;
  
  -- Create quiz attempt
  INSERT INTO quiz_attempts (employee_id, quiz_id, total_questions)
  VALUES (v_employee_id, p_quiz_id, v_total_questions)
  RETURNING id INTO v_quiz_attempt_id;
  
  -- Process each response
  FOR v_response IN SELECT * FROM jsonb_array_elements(p_responses)
  LOOP
    v_question_id := (v_response->>'question_id')::UUID;
    v_selected_option_id := NULLIF(v_response->>'selected_option_id', '')::UUID;
    v_text_answer := v_response->>'text_answer';
    v_is_correct := false;
    
    -- Check if answer is correct
    IF v_selected_option_id IS NOT NULL THEN
      -- Multiple choice question
      SELECT is_correct INTO v_is_correct
      FROM quiz_question_options
      WHERE id = v_selected_option_id;
    ELSE
      -- For now, text answers are not auto-graded
      v_is_correct := false;
    END IF;
    
    -- Insert response
    INSERT INTO quiz_responses (
      quiz_attempt_id, 
      question_id, 
      selected_option_id, 
      text_answer, 
      is_correct
    )
    VALUES (
      v_quiz_attempt_id, 
      v_question_id, 
      v_selected_option_id, 
      v_text_answer, 
      v_is_correct
    );
    
    -- Count correct answers
    IF v_is_correct THEN
      v_correct_count := v_correct_count + 1;
    END IF;
  END LOOP;
  
  -- Update quiz attempt with score
  UPDATE quiz_attempts 
  SET score = v_correct_count
  WHERE id = v_quiz_attempt_id;
  
  -- Mark video as completed if quiz passed (for now, any score marks completion)
  INSERT INTO video_progress (employee_id, video_id, progress_percent, completed_at)
  SELECT v_employee_id, q.video_id, 100, now()
  FROM quizzes q
  WHERE q.id = p_quiz_id
  ON CONFLICT (employee_id, video_id) 
  DO UPDATE SET 
    progress_percent = 100,
    completed_at = now(),
    updated_at = now();
  
  RETURN v_quiz_attempt_id;
END;
$$;