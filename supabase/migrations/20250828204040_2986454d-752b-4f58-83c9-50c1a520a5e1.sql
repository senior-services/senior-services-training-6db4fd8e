-- Clean up duplicate quiz records for Anti-Harassment and Discrimination Policy video
-- Keep the quiz with id '1c6e2d71-5d73-4427-a261-7d6040860d20' as it has the most complete data
-- and delete all other duplicate quizzes for this video

-- First, delete quiz responses for duplicate quizzes (if any)
DELETE FROM quiz_responses 
WHERE quiz_attempt_id IN (
  SELECT qa.id FROM quiz_attempts qa 
  JOIN quizzes q ON qa.quiz_id = q.id 
  WHERE q.video_id = 'e659ee1d-6d65-4588-b84e-26ed889d6aa2' 
  AND q.id != '1c6e2d71-5d73-4427-a261-7d6040860d20'
);

-- Delete quiz attempts for duplicate quizzes (if any)
DELETE FROM quiz_attempts 
WHERE quiz_id IN (
  SELECT id FROM quizzes 
  WHERE video_id = 'e659ee1d-6d65-4588-b84e-26ed889d6aa2' 
  AND id != '1c6e2d71-5d73-4427-a261-7d6040860d20'
);

-- Delete quiz question options for duplicate quizzes
DELETE FROM quiz_question_options 
WHERE question_id IN (
  SELECT qq.id FROM quiz_questions qq 
  JOIN quizzes q ON qq.quiz_id = q.id 
  WHERE q.video_id = 'e659ee1d-6d65-4588-b84e-26ed889d6aa2' 
  AND q.id != '1c6e2d71-5d73-4427-a261-7d6040860d20'
);

-- Delete quiz questions for duplicate quizzes
DELETE FROM quiz_questions 
WHERE quiz_id IN (
  SELECT id FROM quizzes 
  WHERE video_id = 'e659ee1d-6d65-4588-b84e-26ed889d6aa2' 
  AND id != '1c6e2d71-5d73-4427-a261-7d6040860d20'
);

-- Finally, delete the duplicate quiz records themselves
DELETE FROM quizzes 
WHERE video_id = 'e659ee1d-6d65-4588-b84e-26ed889d6aa2' 
AND id != '1c6e2d71-5d73-4427-a261-7d6040860d20';

-- Update the remaining quiz to have a proper title
UPDATE quizzes 
SET title = 'Anti-Harassment and Discrimination Policy - Quiz'
WHERE id = '1c6e2d71-5d73-4427-a261-7d6040860d20';