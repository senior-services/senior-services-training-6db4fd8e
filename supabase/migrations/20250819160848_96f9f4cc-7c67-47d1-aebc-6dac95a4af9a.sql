-- Add YouTube thumbnails to videos based on their video URLs
UPDATE videos 
SET thumbnail_url = CASE 
  WHEN video_url LIKE '%youtube.com/watch%' THEN 
    'https://img.youtube.com/vi/' || 
    SUBSTRING(video_url FROM 'v=([^&]*)') || 
    '/maxresdefault.jpg'
  WHEN video_url LIKE '%youtu.be/%' THEN 
    'https://img.youtube.com/vi/' || 
    SUBSTRING(video_url FROM 'youtu\.be/([^?]*)') || 
    '/maxresdefault.jpg'
  ELSE thumbnail_url 
END
WHERE video_url IS NOT NULL;