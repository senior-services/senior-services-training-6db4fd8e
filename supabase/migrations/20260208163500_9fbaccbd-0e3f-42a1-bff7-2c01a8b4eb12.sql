DROP POLICY "Employees can view active quizzes" ON public.quizzes;

CREATE POLICY "Employees can view active quizzes"
  ON public.quizzes FOR SELECT
  USING (
    has_role(auth.uid(), 'employee'::app_role)
    AND (
      archived_at IS NULL
      OR EXISTS (
        SELECT 1 FROM quiz_attempts qa
        JOIN employees e ON qa.employee_id = e.id
        WHERE qa.quiz_id = quizzes.id
          AND e.email = (auth.jwt() ->> 'email'::text)
      )
    )
  );