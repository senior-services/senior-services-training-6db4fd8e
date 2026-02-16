

## Show "Continue Training" for In-Progress Presentations

### Problem

The heartbeat saves `progress_percent: 0` to the database (by design, to avoid overwriting real progress). This means presentations with accumulated viewing time but no completion still show `progress: 0` in the TrainingCard, so the button reads "Start Training" even though the user has been viewing.

### Solution: Two changes

**1. Update the DB function `get_user_video_assignments` to expose `acknowledgment_viewing_seconds`**

Add `acknowledgment_viewing_seconds` to the JSON object returned in both UNION branches:

- Branch 1 (formal assignments): add `'acknowledgment_viewing_seconds', vp.acknowledgment_viewing_seconds`
- Branch 2 (progress-only): add `'acknowledgment_viewing_seconds', vp2.acknowledgment_viewing_seconds`

This is a non-breaking addition -- existing consumers ignore unknown keys.

**2. Pass `acknowledgmentViewingSeconds` through the data pipeline to TrainingCard**

- **`TrainingVideo` interface** (`src/components/TrainingCard.tsx`, line 29): Add optional field `acknowledgmentViewingSeconds?: number`
- **`transformToTrainingVideo`** (`src/pages/EmployeeDashboard.tsx`, ~line 283): Map `assignment.acknowledgment_viewing_seconds` into the new field
- **`trainingStatus` memo** (`src/components/TrainingCard.tsx`, line 136-144): Update `hasStarted` to also check `acknowledgmentViewingSeconds > 0`:
  ```
  const hasStarted = sanitizedVideo.progress > 0
    || (sanitizedVideo.acknowledgmentViewingSeconds != null
        && sanitizedVideo.acknowledgmentViewingSeconds > 0);
  ```

### What changes for the user

| State | Button Text |
|-------|------------|
| No progress, no viewing seconds | Start Training |
| Viewing seconds > 0 but not complete | Continue Training |
| progress > 0 but not complete | Continue Training (unchanged) |
| Completed | Review Training (unchanged) |

### Technical details

- **Database migration**: ALTER FUNCTION `get_user_video_assignments` to include the new column in both JSON builders.
- **TrainingCard.tsx**: Add interface field + update `hasStarted` logic (2 lines).
- **EmployeeDashboard.tsx**: Pass `acknowledgmentViewingSeconds: assignment?.acknowledgment_viewing_seconds || undefined` in the return object (~line 283).
- No new dependencies, no styling changes, no new components.

### Review

1. **Top 3 Risks**: (a) DB function change is additive -- no breaking impact. (b) Null-safe check prevents false positives. (c) No effect on completed training display.
2. **Top 3 Fixes**: (a) Surfaces real viewing data to the UI. (b) Minimal code change. (c) Works for both videos and presentations.
3. **Database Change**: Yes -- update `get_user_video_assignments` function to include `acknowledgment_viewing_seconds` in JSON output.
4. **Verdict**: Go.
