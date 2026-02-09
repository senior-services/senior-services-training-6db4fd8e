

## Improve Multiple Choice "Incomplete" Feedback

### Problem
When a user selects some but not all correct answers for a multiple choice question, the review screen doesn't clearly communicate **why** they got it wrong. The "Also Correct" badge blends in with the "Correct" badge (both green), making it hard to notice missed answers.

### Changes (1 file)

**File: `src/components/quiz/QuizModal.tsx`**

1. **Add Banner import** at the top of the file alongside existing imports.

2. **Change "Also Correct" badge variant** (line 317-320): Switch from `soft-success` (green) to `soft-attention` (amber) to visually distinguish missed correct answers from selected correct answers. The attention icon will automatically appear via the `showIcon` prop.

3. **Add inline attention banner above the question content** (inside the Card, before the options list around line 237): When the quiz is submitted and the user identified some correct answers but missed others, display:
   ```tsx
   <Banner 
     variant="attention" 
     size="compact" 
     description="Incomplete. You identified some correct answers, but not all of them were selected." 
   />
   ```
   This banner only appears for multiple choice questions where `shouldShowAlsoCorrect` is true (user got some right but missed at least one correct option). The logic for `shouldShowAlsoCorrect` already exists at line 269 -- it will be computed earlier (before the options loop) so the banner can reference it.

4. **Move `shouldShowAlsoCorrect` calculation** outside the per-option loop so it can be used both for the banner (above the options) and for individual option badges (inside the loop). The variables `correctOptionIds`, `selectedOptionIds`, and `hasMissedCorrect` will be calculated once at the question level.

### What the User Will See (Review Mode)
- A compact amber banner above incomplete multiple choice questions explaining what went wrong
- Missed correct answers marked with an amber "Also Correct" badge (instead of green)
- Selected correct answers still show green "Correct" badge
- Selected incorrect answers still show red "Incorrect" badge

### Review
- **Top 5 Risks**: (1) Must ensure `shouldShowAlsoCorrect` logic works outside the options loop -- existing variables just need hoisting. (2) Banner only shows for submitted quizzes in review mode. (3) No impact on quiz-taking flow. (4) No database changes. (5) Attention variant already exists and is tested.
- **Top 5 Fixes**: (1) Hoist question-level correctness calculation above options map. (2) Add conditional Banner render. (3) Change "Also Correct" badge to `soft-attention`. (4) No new components needed. (5) Leverages existing compact Banner variant.
- **Database Change Required**: No
- **Go/No-Go**: Go

