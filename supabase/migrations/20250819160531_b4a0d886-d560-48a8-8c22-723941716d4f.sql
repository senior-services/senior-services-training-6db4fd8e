-- Update videos with real YouTube URLs that match their training topics

UPDATE videos 
SET video_url = CASE 
  WHEN title LIKE '%Workplace Safety%' THEN 'https://www.youtube.com/watch?v=8WnTg6TNr98'
  WHEN title LIKE '%Anti-Harassment%' THEN 'https://www.youtube.com/watch?v=ZF8wZuZoUf8'  
  WHEN title LIKE '%Data Privacy%' THEN 'https://www.youtube.com/watch?v=BGMG7AIKNRg'
  WHEN title LIKE '%Employee Code%' THEN 'https://www.youtube.com/watch?v=C4si6n36n30'
  WHEN title LIKE '%Time Management%' THEN 'https://www.youtube.com/watch?v=PxkJ2kYmQkw'
  WHEN title LIKE '%Performance Review%' THEN 'https://www.youtube.com/watch?v=bH8RlRrFARo'
  ELSE video_url 
END
WHERE title IS NOT NULL;