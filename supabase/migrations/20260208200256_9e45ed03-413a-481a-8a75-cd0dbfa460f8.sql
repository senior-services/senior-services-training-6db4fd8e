UPDATE quiz_attempts qa
SET score = correct_counts.correct_count
FROM (
  SELECT
    quiz_attempt_id,
    COUNT(*) FILTER (
      WHERE question_id NOT IN (
        SELECT question_id
        FROM quiz_responses qr2
        WHERE qr2.quiz_attempt_id = quiz_responses.quiz_attempt_id
          AND qr2.is_correct = false
      )
    ) AS correct_count
  FROM (
    SELECT DISTINCT quiz_attempt_id, question_id
    FROM quiz_responses
  ) quiz_responses
  GROUP BY quiz_attempt_id
) correct_counts
WHERE qa.id = correct_counts.quiz_attempt_id
  AND qa.score != correct_counts.correct_count;