-- Add duration_seconds field to videos table to store actual video duration
ALTER TABLE videos ADD COLUMN duration_seconds INTEGER DEFAULT 0;

-- Add a comment to explain the field
COMMENT ON COLUMN videos.duration_seconds IS 'Video duration in seconds';