-- Part C: One-time data backfill to fix records with 100% progress but missing completed_at
UPDATE video_progress
SET completed_at = updated_at
WHERE progress_percent = 100
  AND completed_at IS NULL;