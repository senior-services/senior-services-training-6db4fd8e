-- Update existing videos with realistic durations (in seconds)
UPDATE videos SET duration_seconds = 900 WHERE title = 'Anti-Harassment and Discrimination Policy'; -- 15 minutes
UPDATE videos SET duration_seconds = 1200 WHERE title = 'Workplace Safety and Emergency Procedures'; -- 20 minutes  
UPDATE videos SET duration_seconds = 600 WHERE title = 'Time Management and Productivity Best Practices'; -- 10 minutes
UPDATE videos SET duration_seconds = 1500 WHERE title = 'Data Privacy and Information Security'; -- 25 minutes
UPDATE videos SET duration_seconds = 480 WHERE title = 'Performance Review Process and Career Development'; -- 8 minutes
UPDATE videos SET duration_seconds = 720 WHERE title = 'Video Title A'; -- 12 minutes
UPDATE videos SET duration_seconds = 840 WHERE title = 'Video Title B'; -- 14 minutes

-- Set a default duration for any remaining videos with 0 duration
UPDATE videos SET duration_seconds = 600 WHERE duration_seconds = 0; -- 10 minutes default