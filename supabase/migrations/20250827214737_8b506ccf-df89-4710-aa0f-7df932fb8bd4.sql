-- Update existing YouTube videos that don't have thumbnail_url
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
  END || '/maxresdefault.jpg'
WHERE thumbnail_url IS NULL 
  AND video_url IS NOT NULL 
  AND video_url ~ '(youtube\.com|youtu\.be)';

-- Update existing Google Drive videos that don't have thumbnail_url  
UPDATE videos 
SET thumbnail_url = 'https://drive.google.com/thumbnail?id=' || 
  CASE 
    WHEN video_url ~ '/file/d/([^/]+)/' THEN 
      substring(video_url from '/file/d/([^/]+)/')
    WHEN video_url ~ 'id=([^&]+)' THEN 
      substring(video_url from 'id=([^&]+)')
  END || '&sz=w800-h600'
WHERE thumbnail_url IS NULL 
  AND video_url IS NOT NULL 
  AND video_url ~ 'drive\.google\.com';