
# Plan: Fix Missing Course Titles in Employee Data Export

## The Problem

When you download the employee data Excel file, 4 course titles show up as blank even though the other data (status, due date, completion date, quiz results) is present. These courses are:
- YT: Information Security and Data Privacy
- YT: Time Management and Productivity Best Practices  
- YT: Timekeeping and Attendance
- YT: Workplace Safety and Emergency Procedures

## Root Cause

All 4 courses are **hidden** (archived) in the system. The database function that retrieves employee assignments has a bug - it only joins video titles when the video is NOT hidden:

```sql
LEFT JOIN videos v ON va.video_id = v.id AND v.archived_at IS NULL
```

This causes hidden video titles to come back as `NULL`, resulting in blank course names in the export.

---

## The Fix

Modify the database function `get_all_employee_assignments` to include video titles regardless of whether the video is hidden. The JOIN should fetch the video title in all cases.

**Change this line:**
```sql
LEFT JOIN videos v ON va.video_id = v.id AND v.archived_at IS NULL
```

**To this:**
```sql
LEFT JOIN videos v ON va.video_id = v.id
```

This ensures employees still see their assigned courses (and admins see them in exports) even when the video has been hidden from the main course list.

---

## Why This Is Correct

According to the system design (noted in the hidden videos section of the UI):
> "Hidden videos remain functional for employees with assignments"

This means hidden videos should still appear in:
- Employee dashboards (for those with existing assignments)
- Admin reports and data exports

---

## Database Change Required

| Type | Change |
|------|--------|
| Database Migration | Modify `get_all_employee_assignments` function to remove `AND v.archived_at IS NULL` from the videos JOIN |

## Files Modified

None - this is a database-only fix.

---

## Expected Result

After the fix, the Excel export will show all course titles including hidden ones, matching the complete data that already exists in the database.
