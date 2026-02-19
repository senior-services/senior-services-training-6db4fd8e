-- Clean HTML entities from videos
UPDATE videos SET
  title = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(title,
    '&amp;', '&'), '&quot;', '"'), '&apos;', ''''),
    '&#39;', ''''), '&lt;', '<'), '&gt;', '>')
WHERE title LIKE '%&amp;%' OR title LIKE '%&quot;%' OR title LIKE '%&apos;%'
   OR title LIKE '%&#39;%' OR title LIKE '%&lt;%' OR title LIKE '%&gt;%';

UPDATE videos SET
  description = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(description,
    '&amp;', '&'), '&quot;', '"'), '&apos;', ''''),
    '&#39;', ''''), '&lt;', '<'), '&gt;', '>')
WHERE description IS NOT NULL AND (
  description LIKE '%&amp;%' OR description LIKE '%&quot;%' OR description LIKE '%&apos;%'
   OR description LIKE '%&#39;%' OR description LIKE '%&lt;%' OR description LIKE '%&gt;%');

-- Clean HTML entities from quiz questions
UPDATE quiz_questions SET
  question_text = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(question_text,
    '&amp;', '&'), '&quot;', '"'), '&apos;', ''''),
    '&#39;', ''''), '&lt;', '<'), '&gt;', '>')
WHERE question_text LIKE '%&amp;%' OR question_text LIKE '%&quot;%' OR question_text LIKE '%&apos;%'
   OR question_text LIKE '%&#39;%' OR question_text LIKE '%&lt;%' OR question_text LIKE '%&gt;%';

-- Clean HTML entities from quiz options
UPDATE quiz_question_options SET
  option_text = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(option_text,
    '&amp;', '&'), '&quot;', '"'), '&apos;', ''''),
    '&#39;', ''''), '&lt;', '<'), '&gt;', '>')
WHERE option_text LIKE '%&amp;%' OR option_text LIKE '%&quot;%' OR option_text LIKE '%&apos;%'
   OR option_text LIKE '%&#39;%' OR option_text LIKE '%&lt;%' OR option_text LIKE '%&gt;%';