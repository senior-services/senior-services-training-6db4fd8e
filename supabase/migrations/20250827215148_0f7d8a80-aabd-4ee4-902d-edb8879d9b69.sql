-- Update existing YouTube videos to use more reliable hqdefault.jpg thumbnails
UPDATE videos 
SET thumbnail_url = 'https://img.youtube.com/vi/' || 
  CASE 
    -- Handle different YouTube URL formats
    WHEN video_url ~ 'youtube\.com/watch\?.*v=([^&]+)' THEN 
      substring(video_url from 'v=([^&]+)')
    WHEN video_url ~ 'youtu\.be/([^?]+)' THEN 
      substring(video_url from 'youtu\.be/([^?]+)')
    WHEN video_url ~ 'youtube\.com/embed/([^?]+)' THEN 
      substring(video_url from 'embed/([^?]+)')
    WHEN video_url ~ 'youtube\.com/shorts/([^?]+)' THEN 
      substring(video_url from 'shorts/([^?]+)')
  END || '/hqdefault.jpg'
WHERE video_url IS NOT NULL 
  AND video_url ~ '(youtube\.com|youtu\.be)'
  AND thumbnail_url LIKE '%maxresdefault.jpg%';