
## Fix: Employee Sees Wrong Quiz Version After Versioning

### What's Happening Now
When Jane opens her completed training, the app loads the quiz using `getByVideoId`, which always fetches the **latest active quiz** (Version 2 with 2 questions). So even though Jane completed Version 1 (1 question, scored 1/1), she sees Version 2's questions and an incorrect score of "50% (1/2 correct)."

### What Should Happen
Jane should see Version 1 -- the exact quiz she completed -- with her correct score of "100% (1/1 correct)."

### The Fix
When an employee has already completed a quiz, load the quiz version from their attempt instead of the latest active version. This is an application code change in `VideoPlayerFullscreen.tsx`.

### Risk Assessment

**Top 5 Risks/Issues:**
1. The `getUserAttempts` query already returns the quiz data via the `quizzes(*)` join -- we need to use it instead of discarding it
2. Must not break the flow for employees who haven't yet taken a quiz (they should still see the active version)
3. The correct options fetch (`getCorrectOptionsForQuiz`) must use the correct quiz ID (V1's ID, not V2's)
4. The quiz questions/options need to be fully loaded for the completed version (the attempt only includes quiz metadata, not questions)
5. Must handle the edge case where an employee completed V1 but V2 also exists and they haven't retaken it

**Top 5 Fixes/Improvements:**
1. In `VideoPlayerFullscreen.tsx`, after detecting `wasEverCompleted`, fetch the completed quiz version using `getById(latestAttempt.quiz_id)` instead of relying on `getByVideoId`
2. Use the completed quiz's ID for `getCorrectOptionsForQuiz` call
3. Store the "display quiz" (completed version) in state, separate from the active quiz used for new attempts
4. Fall back to the active quiz if no completed attempt exists
5. No database changes needed -- this is purely an application-layer fix

**Database Change Required:** No
**Go/No-Go Verdict:** Go -- targeted fix in one component, corrects version-aware display logic.

### Technical Detail

**File:** `src/components/VideoPlayerFullscreen.tsx`

**Change 1: Add state for the completed quiz version**
Add a new state variable `completedQuiz` to hold the quiz version the employee actually completed.

**Change 2: Update the completed quiz results loading effect (lines 200-224)**
When `wasEverCompleted` is true, use `quizOperations.getById(latestAttempt.quiz_id)` to load the specific quiz version the employee completed (with its questions and options). Store it in `completedQuiz`. Use that quiz's ID for `getCorrectOptionsForQuiz`.

**Change 3: Update the QuizModal rendering (line 546-547)**
Pass `completedQuiz` (when available) instead of `quiz` to QuizModal when displaying completed results:
- When `wasEverCompleted && completedQuiz` -- use `completedQuiz`
- When `quizStarted && quiz` (taking a new quiz) -- use `quiz` (the active version)

**Change 4: Reset `completedQuiz` state**
Add `completedQuiz` to the reset logic when the modal closes (around line 143).
