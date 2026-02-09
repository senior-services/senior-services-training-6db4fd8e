

## Consistency Fix + Code Cleanup Plan

### What This Fixes (in plain language)

Right now, the same logic for deciding "Is this training complete?", "What quiz version?", and "Is this person exempt?" is written separately in **four different places**. Each copy has slight differences, which is why John's training shows correctly in one view but not another. This plan consolidates all that logic into one shared location and removes the duplicated code.

### What Gets Cleaned Up

**Duplicated logic that currently exists in 4 places:**
- Assign Videos Dialog (`AssignVideosModal.tsx`)
- Data Export (`EmployeeManagement.tsx`)
- Employee Dashboard (`EmployeeDashboard.tsx` via `VideoPage.tsx`)
- Completion calculation (inline in `AssignVideosModal.tsx` loading logic)

Each independently computes: legacy exemption, completion status, quiz version display, quiz results display, and completion date. After this change, all four will call the same shared functions.

### Changes

**1. New file: `src/utils/quizHelpers.ts`**

Create a small utility file with these shared functions:

- `isLegacyExempt(completedAt, quizCreatedAt)` -- single place for the date comparison logic (currently written 4 times)
- `getTrainingStatus(progressData, quizAttempt, hasQuiz, quizCreatedAt, dueDate)` -- returns "completed", "overdue", "pending", or "unassigned"
- `getDisplayQuizResults(quizAttempt, hasQuiz, isExempt)` -- returns the quiz results string/label
- `getDisplayQuizVersion(quizAttempt, latestVersion, hasQuiz, isExempt)` -- returns the version to display
- `getCompletionDate(quizAttempt, progressData)` -- returns the right date (quiz attempt date first, then video completion date)

Each function is simple (5-15 lines) with no component dependencies.

**2. Update DB functions (migration)**

Modify `get_all_employee_assignments()` and `get_hidden_employee_assignments()` to also return completed videos that have no formal assignment. This ensures the data export and admin list see the same trainings as the Assign Videos dialog.

**3. Simplify `AssignVideosModal.tsx`**

- Remove the inline `isLegacyExempt` function (line 602-609) -- replaced by shared helper
- Simplify `getQuizResults` (line 612-643) -- call shared `getDisplayQuizResults()` instead
- Simplify `getQuizVersion` (line 648-673) -- call shared `getDisplayQuizVersion()` instead
- Simplify `formatDueDate` completion date logic -- call shared `getCompletionDate()`
- Simplify the completion calculation in the loading effect (lines 219-226) -- call shared `isLegacyExempt()`

**4. Simplify `EmployeeManagement.tsx` export logic**

- Remove the duplicated quiz results/version/completion date logic (lines 481-524) -- replace with calls to shared helpers
- Remove the inline `quizCreationDates` exemption check -- use shared `isLegacyExempt()`

**5. Simplify `VideoPage.tsx`**

- Replace the inline legacy exemption check (line 94) with the shared `isLegacyExempt()` call

### What Gets Removed

| Current Code | Location | Replaced By |
|---|---|---|
| Inline `isLegacyExempt` function | AssignVideosModal.tsx lines 602-609 | Shared `isLegacyExempt()` |
| Inline legacy check in loading effect | AssignVideosModal.tsx lines 219-222 | Shared `isLegacyExempt()` |
| Inline legacy check | VideoPage.tsx line 94 | Shared `isLegacyExempt()` |
| Inline legacy check via `quizCreationDates` | EmployeeManagement.tsx lines 489-494 | Shared `isLegacyExempt()` |
| Quiz results display logic | AssignVideosModal.tsx lines 612-643 | Shared `getDisplayQuizResults()` |
| Quiz results string building | EmployeeManagement.tsx lines 481-498 | Shared `getDisplayQuizResults()` |
| Quiz version display logic | AssignVideosModal.tsx lines 648-673 | Shared `getDisplayQuizVersion()` |
| Quiz version string building | EmployeeManagement.tsx lines 522-524 | Shared `getDisplayQuizVersion()` |
| Completion date logic | EmployeeManagement.tsx lines 505-512 | Shared `getCompletionDate()` |

### What Stays the Same

- All visual styling and component structure remains unchanged
- Database tables and their schemas are not modified
- The Employee Dashboard appearance stays the same
- No new features are added

### Technical Details

**Quiz version fix**: Currently all surfaces show the *latest* quiz version. After this change, when an employee has a quiz attempt, the version stored in that attempt record is shown instead. This matches what the Excel export already does for some cases.

**Completion date fix**: All surfaces will consistently use the quiz attempt completion timestamp when available, falling back to video progress completion timestamp. This matches the export behavior.

### Review

- **Top 5 Risks**: (1) DB function change affects all consumers -- but the output shape stays the same, just adds more rows. (2) Shared helpers must handle all edge cases that the 4 separate implementations currently handle. (3) Need thorough testing across all 4 surfaces after changes.
- **Top 5 Fixes**: (1) Single source of truth for legacy exemption logic. (2) Single source of truth for quiz version display. (3) Single source of truth for completion date. (4) DB functions include unassigned completions. (5) Remove ~60 lines of duplicated logic.
- **Database Change Required**: Yes -- modify two DB functions to include completed-but-unassigned videos.
- **Go/No-Go**: Go

