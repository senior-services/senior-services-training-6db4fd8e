
# Plan: Fix Hidden Videos Appearing in Employee Dashboard

## Problem Summary
The "YT: Time Management and Productivity Best Practices" video is hidden (`archived_at` is set), but it's still being returned to the employee dashboard. Hidden videos should not appear in employee training lists.

## Root Cause
The database function `get_user_video_assignments` returns **all assigned videos**, including those that have been hidden. There's no filter for `archived_at IS NULL`.

## Solution
Add a filter to the database function to exclude hidden videos from employee assignments.

---

## Database Change Required: Yes

**File:** Database function `get_user_video_assignments`

**Current query (line 154):**
```sql
WHERE e.email = user_email;
```

**Updated query:**
```sql
WHERE e.email = user_email
  AND v.archived_at IS NULL;
```

This ensures that hidden videos are never returned to employees, keeping their training lists clean and focused on active content.

---

## Technical Details

### Migration SQL
```sql
CREATE OR REPLACE FUNCTION public.get_user_video_assignments(user_email text)
RETURNS TABLE(video json, assignment json)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    row_to_json(v.*) as video,
    json_build_object(
      'due_date', va.due_date,
      'assigned_at', va.created_at,
      'assignment_id', va.id,
      'progress_percent', COALESCE(vp.progress_percent, 0),
      'completed_at', vp.completed_at
    ) as assignment
  FROM video_assignments va
  JOIN videos v ON va.video_id = v.id
  JOIN employees e ON va.employee_id = e.id
  LEFT JOIN video_progress vp ON (e.id = vp.employee_id AND va.video_id = vp.video_id)
  WHERE e.email = user_email
    AND v.archived_at IS NULL;  -- Filter out hidden videos
END;
$$;
```

---

## What This Changes

| Scenario | Before | After |
|----------|--------|-------|
| Hidden video assigned to employee | Shown on dashboard | Not shown |
| Active video assigned to employee | Shown on dashboard | Shown on dashboard |
| Hidden video in reports/exports | Included (per architecture memory) | Still included |

---

## No Client-Side Changes Needed
The filtering happens at the database level, so no changes to React components or TypeScript code are required.

---

## Verification Steps
1. Run the migration to update the function
2. Confirm the "YT: Time Management..." video no longer appears on Jane's dashboard
3. Verify other active assigned videos still appear correctly
