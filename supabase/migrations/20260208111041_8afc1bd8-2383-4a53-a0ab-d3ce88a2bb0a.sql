UPDATE quizzes q
SET title = v.title,
    description = NULL,
    updated_at = now()
FROM videos v
WHERE q.video_id = v.id;