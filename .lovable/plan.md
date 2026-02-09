

## Hide Quiz for Legacy-Exempt Employees on VideoPage

### Problem
When an employee has already completed a training (video only, no quiz at the time), and an admin later adds a quiz, the employee currently sees the new quiz when they revisit the training. Since they are legacy-exempt, the quiz should be hidden entirely -- they should not be prompted to take it.

### Root Cause
In `VideoPage.tsx`, the quiz is loaded unconditionally via `quizOperations.getByVideoId()` and passed to `CompletionOverlay`. There is no check for whether the employee completed the video before the quiz was created.

### Change

**File: `src/pages/VideoPage.tsx`**

After loading both the quiz data and the existing progress, compare the employee's `completed_at` timestamp with the quiz's `created_at` timestamp. If the employee completed the video before the quiz was created, treat the quiz as `null` so it is never shown.

Specifically:
1. Store `completed_at` from the progress data when loading existing progress (currently only `progress_percent` and `completed_at` are available but `completed_at` is not saved to state).
2. After both quiz and progress are loaded, add a derived check: if `completed_at` exists and is earlier than `quiz.created_at`, set quiz to `null`.
3. This also means `hasQuiz` passed to `useVideoProgress` will be `false`, so the progress hook won't cap at 99% unnecessarily.

Implementation detail:
- Add a `completedAt` state variable (or ref) to track the employee's existing completion date.
- In `loadVideo`, after loading progress, check the exemption condition and clear the quiz if applicable.
- The `CompletionOverlay` and `useVideoProgress` hook will then behave correctly with no further changes needed since they already check `quiz` / `hasQuiz`.

### Review
- **Top 5 Risks**: (1) Timezone edge case if `completed_at` and `created_at` are very close -- mitigated by the fact that quiz creation is a separate admin action. (2) If progress data fails to load, quiz will show as a safe fallback. No other significant risks.
- **Top 5 Fixes**: (1) Store `completed_at` from progress. (2) Compare with `quiz.created_at` to determine exemption. (3) Null out quiz for exempt employees.
- **Database Change Required**: No
- **Go/No-Go**: Go
