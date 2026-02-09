
-- Delete all data for "YT: Social Media and Communications Policy" (video ID: 11271721-3851-4fe7-a0c6-ad8b2a6c1ad4)

-- 1. Quiz responses
DELETE FROM quiz_responses WHERE quiz_attempt_id IN (
  SELECT id FROM quiz_attempts WHERE quiz_id = '989afcff-9320-4053-a3ef-4ea538d64a04'
);

-- 2. Quiz attempts
DELETE FROM quiz_attempts WHERE quiz_id = '989afcff-9320-4053-a3ef-4ea538d64a04';

-- 3. Quiz question options
DELETE FROM quiz_question_options WHERE question_id IN (
  SELECT id FROM quiz_questions WHERE quiz_id = '989afcff-9320-4053-a3ef-4ea538d64a04'
);

-- 4. Quiz questions
DELETE FROM quiz_questions WHERE quiz_id = '989afcff-9320-4053-a3ef-4ea538d64a04';

-- 5. Quiz
DELETE FROM quizzes WHERE id = '989afcff-9320-4053-a3ef-4ea538d64a04';

-- 6. Video progress
DELETE FROM video_progress WHERE video_id = '11271721-3851-4fe7-a0c6-ad8b2a6c1ad4';

-- 7. Video assignments
DELETE FROM video_assignments WHERE video_id = '11271721-3851-4fe7-a0c6-ad8b2a6c1ad4';

-- 8. Video record
DELETE FROM videos WHERE id = '11271721-3851-4fe7-a0c6-ad8b2a6c1ad4';
