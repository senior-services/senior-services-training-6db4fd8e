

## Fix: Unassigning Progress-Only (Effective) Assignments

### Root Cause
The `handleUnassign` function only deletes `video_assignments` rows. Trainings that appear as assigned due to a `video_progress` record (but no formal assignment) are skipped, causing the silent no-op.

### Changes

**1. `src/services/api.ts` -- Add `deleteByEmployeeAndVideo` to `progressOperations` (~after line 980)**

```typescript
async deleteByEmployeeAndVideo(employeeId: string, videoId: string): Promise<ApiResult<boolean>> {
  try {
    const { error } = await supabase
      .from('video_progress')
      .delete()
      .eq('employee_id', employeeId)
      .eq('video_id', videoId);

    if (error) {
      logger.error('Failed to delete progress', undefined, { employeeId, videoId, supabaseError: error.message });
      return { data: null, error: error.message, success: false };
    }
    return { data: true, error: null, success: true };
  } catch (err) {
    return { data: null, error: String(err), success: false };
  }
}
```

**2. `src/components/dashboard/AssignVideosModal.tsx` -- Update `handleUnassign` (lines 432-438)**

Add an `else` branch to delete the `video_progress` row when no formal assignment exists:

```typescript
for (const videoId of videosToUnassign) {
  const assignment = assignmentData.get(videoId);
  if (assignment) {
    promises.push(assignmentOperations.delete(assignment.id));
  } else {
    // Progress-only effective assignment -- remove the progress record
    promises.push(progressOperations.deleteByEmployeeAndVideo(employee.id, videoId));
  }
}
```

Add `progressOperations` to the existing import from `@/services/api`.

### Review
1. **Top 3 Risks**: None -- admin has ALL policy on `video_progress`; only affects explicitly selected items.
2. **Top 3 Fixes**: (a) Fixes silent no-op for progress-only unassigns. (b) Covers all content types (video, presentation). (c) Follows existing `ApiResult` pattern.
3. **Database Change**: No.
4. **Verdict**: Go.
