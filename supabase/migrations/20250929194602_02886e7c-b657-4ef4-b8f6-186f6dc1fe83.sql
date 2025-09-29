-- Fix existing misclassified presentations
-- Any video with a Google Presentation URL should be marked as content_type 'presentation'
UPDATE videos 
SET content_type = 'presentation', 
    updated_at = now()
WHERE video_url LIKE '%docs.google.com/presentation%' 
  AND content_type = 'video';