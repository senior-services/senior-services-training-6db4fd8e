

## Fix Quiz Version Discrepancies

### Problem 1: "Legacy - No Quiz" shows a version number instead of "N/A"
When an employee is legacy-exempt (Quiz Results = "Legacy - No Quiz"), the data download still shows a version number (e.g., "1") because a quiz technically exists for that video. Since the employee is exempt from the quiz, the version should show "N/A" to match the Assign Videos dialog behavior.

### Problem 2: Completed quiz versions differ between views
The data download shows the version the employee *took* (from their attempt record), while the Assign Videos dialog shows the *current active* version. For example, if an employee completed version 1 but the quiz has since been updated to version 3, the download shows "1" while the dialog shows "3". These should be consistent -- both showing the current active quiz version.

### Changes

**File: `src/components/dashboard/EmployeeManagement.tsx`**

1. **Fix "Legacy - No Quiz" version (line 522)**: Add a condition to check if `quizResults` is "Legacy - No Quiz" and return "N/A" instead of the active quiz version.

2. **Use active version for completed attempts too (line 522)**: Instead of using `quizAttempt.quiz_version` (the historical version), use the active version from `quizVersions` map for consistency with the Assign Videos dialog.

Updated logic for the Quiz Version field:
- If quiz results are "Legacy - No Quiz" or "N/A" (no quiz exists): show "N/A"
- If a quiz exists for this video: show the active version from `quizVersions` map (regardless of whether the employee has an attempt)
- Otherwise: show "--"

**File: `src/components/dashboard/AssignVideosModal.tsx`**

No changes needed -- the dialog already shows the correct values.

### Review
- **Top 5 Risks**: (1) Changing from attempt version to active version means historical data (which specific version the employee took) is no longer visible in the export -- acceptable since the user wants consistency. No other significant risks.
- **Top 5 Fixes**: (1) Add "Legacy - No Quiz" check to return "N/A". (2) Use active quiz version instead of attempt version for all rows.
- **Database Change Required**: No
- **Go/No-Go**: Go
