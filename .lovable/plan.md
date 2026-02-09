

## Fix Quiz Version Discrepancy in Data Download

### Problem
The data download shows "--" for Quiz Version on courses where the employee hasn't completed the quiz yet, even though the Assign Videos dialog correctly shows "1" (the active quiz version). This happens because the download only pulls version from the employee's quiz *attempt* record, which doesn't exist until they complete the quiz.

### Solution
Fetch the active quiz version from the quizzes table (same approach as the Assign Videos dialog) and use it as a fallback when there's no quiz attempt.

### Changes

**File: `src/components/dashboard/EmployeeManagement.tsx`**

1. **Update quiz queries** (3 locations: lines 131, 355, 540): Add `version` to the select: `'video_id, created_at, version'`

2. **Build version maps** (3 locations alongside quizCreationDates): Create a `quizVersions` map storing the highest version per `video_id`, same pattern as the Assign Videos dialog.

3. **Pass version map to export function** (line 414 signature + line 549 call): Add `quizVersions: Map<string, number>` parameter.

4. **Update Quiz Version logic** (line 507): Change from attempt-only to fallback logic:
   - If `quizAttempt?.quiz_version` exists, use it (actual attempt version)
   - Else if a quiz exists for this video, use the active version from `quizVersions` map
   - Else if no quiz at all: "N/A"

### Review
- **Top 5 Risks**: (1) Must update all 3 quiz query locations consistently. No other risks -- straightforward data plumbing.
- **Top 5 Fixes**: (1) Add `version` to quiz selects. (2) Build version maps. (3) Pass to export function. (4) Use as fallback in version column logic.
- **Database Change Required**: No
- **Go/No-Go**: Go
