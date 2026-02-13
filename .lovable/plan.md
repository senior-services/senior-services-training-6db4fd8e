
## Fix: Assign Videos Modal Data Discrepancy

### Root Cause

The "Assign Videos" modal determines "Assigned" vs "Unassigned" by querying the `video_assignments` table directly (`assignmentOperations.getByEmployee`). This only returns videos with a formal assignment row.

However, John has 2 videos where he watched content (99% progress via `video_progress`) but was never formally assigned. These progress-only records:
- **Admin Employee tab**: Counted as required (via `get_all_employee_assignments` UNION ALL)
- **Employee Dashboard**: Counted as required (via `get_user_video_assignments` UNION ALL -- just fixed)
- **Data Export**: Counted as required (same DB function)
- **Assign Videos modal**: Shows as "Unassigned" because they have no `video_assignments` row

This means the modal shows 5 Assigned + the 2 progress-only items hidden under "Unassigned", while every other view shows 7.

### Fix

**File: `src/components/dashboard/AssignVideosModal.tsx`**

After loading progress data (around line 237), add progress-only video IDs to `assignedVideoIds` so they appear in the "Assigned" filter. Videos with existing progress but no formal assignment should be treated as effectively assigned for display consistency.

In `loadVideosAndAssignments`, after processing assignments (line 237-259), iterate `videoProgressData` and add any video IDs that have progress but are NOT in `assignedVideoIds` to the assigned set:

```tsx
// After setting assignedVideoIds from assignments data:
// Add progress-only videos (no formal assignment but have progress) to assigned set
if (progressResult.success && progressResult.data) {
  const currentlyAssigned = new Set(assignmentsResult.data.map((a) => a.video_id));
  progressResult.data.forEach((progress) => {
    if (!currentlyAssigned.has(progress.video_id)) {
      currentlyAssigned.add(progress.video_id);
    }
  });
  setAssignedVideoIds(currentlyAssigned);
}
```

This single change ensures:
- "Assigned" tab count matches admin/employee/export counts
- "Unassigned" tab no longer shows videos the employee already started
- "Completed" tab remains unchanged (driven by `completedVideoIds`)
- Progress-only videos cannot be "unassigned" (no assignment row to delete) -- they already pass the `completedVideoIds` or checkbox guard

### Review

1. **Top 3 Risks:** (a) Progress-only items appear in the Assigned tab but lack a formal assignment row, so the "Unassign" action would be a no-op -- mitigated because the checkbox guard already prevents toggling completed items, and progress-only items without completion still pass through `getSelectedAssignedIds` which checks `assignmentData` for the actual row. (b) If an admin tries to unassign a progress-only item, `assignmentData.get(videoId)` returns undefined, so the delete promise is skipped. (c) No visual change to completed or unassigned items that genuinely have no progress.
2. **Top 3 Fixes:** (a) Assigned count now matches all other views. (b) Unassigned count no longer inflated by started trainings. (c) Single-file change, no DB migration needed.
3. **Database Change:** No.
4. **Verdict:** Go.
