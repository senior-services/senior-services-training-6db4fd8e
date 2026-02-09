

## Fix Admin View: Legacy Quiz Exemption for Pre-Quiz Completions

### Problem
When an admin views Jane's assignments, "Time Management" shows as "To-do" with "Not Completed" quiz results, even though Jane completed the training before the quiz was added. The employee dashboard correctly handles this exemption, but the admin modal does not.

### Root Cause
The AssignVideosModal fetches quiz data as a simple `Set<string>` of video IDs (no creation timestamps), so it cannot compare quiz creation dates against video completion dates to determine exemptions. The employee dashboard correctly uses a `Map` with `createdAt` timestamps.

### What Will Change
Two fixes in **`src/components/dashboard/AssignVideosModal.tsx`**:

1. **Fetch quiz creation dates** -- Change the quizzes query from `select("video_id")` to `select("video_id, created_at")`, and store as a Map with timestamps instead of a plain Set.

2. **Apply exemption in completion logic** -- Before requiring quiz completion, check if the employee's video completion date is earlier than the quiz creation date. If so, treat as completed without quiz.

3. **Show "Legacy - No Quiz" in quiz results** -- When a video has a quiz but the employee is exempt (completed before quiz existed), display "Legacy - No Quiz" instead of "Not Completed".

### Expected Result
- "Time Management" will show **Completed** status in admin view
- Quiz Results column will show **"Legacy - No Quiz"** for exempt completions
- No change to employee dashboard behavior (already correct)

### Technical Details

**File: `src/components/dashboard/AssignVideosModal.tsx`**

- **State change (line 89):** Convert `videoIdsWithQuizzes` from `Set<string>` to `Map<string, string>` (video_id to created_at).
- **Query change (line 129):** Fetch `created_at` alongside `video_id` from quizzes table.
- **Completion logic (lines 188-206):** Add exemption check comparing `progress.completed_at` with quiz `created_at`.
- **Quiz results display (lines 567-595):** Add "Legacy - No Quiz" branch for exempt employees.

### Review

- **Top 5 Risks**: (1) Slight data model change from Set to Map could affect other references to `videoIdsWithQuizzes` -- low risk since it's scoped to this component. (2) Date comparison edge cases around same-day completion/quiz creation -- mitigated by strict less-than comparison matching employee dashboard logic.
- **Top 5 Fixes**: (1) Fetch quiz creation dates. (2) Apply exemption in completion determination. (3) Show "Legacy - No Quiz" label. (4) Keep logic aligned with employee dashboard. (5) Maintain existing quiz attempt display for non-exempt cases.
- **Database Change Required**: No
- **Go/No-Go**: Go

