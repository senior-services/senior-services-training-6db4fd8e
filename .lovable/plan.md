

## Re-apply: Quiz Dialog Header, Description & Attestation Layout Changes

### Changes (3 changes across 2 files)

**File 1: `src/components/VideoPlayerFullscreen.tsx`**

1. **Add Label import** (line 6 area) -- add `import { Label } from "@/components/ui/label";`

2. **Remove Play icon from header** (line 482) -- delete the `<Play>` icon, keep just the title text

3. **Change description text color** (line 489) -- change `text-muted-foreground` to `text-foreground`

4. **Remove Play import** (line 4) -- remove unused `Play` import from lucide-react

5. **Restructure DialogFooter** (lines 575-610) -- add attestation checkbox on the left side using `justify-between` layout:
   - Active quiz (not submitted): attestation checkbox + label on left, Cancel + Submit buttons on right
   - Completed/review: attestation checkbox (checked, disabled) + label on left, Close button on right
   - Checkbox uses existing `quizAttestationChecked` state and `setQuizAttestationChecked`

**File 2: `src/components/quiz/QuizModal.tsx`**

6. **Remove attestation block** (lines 486-524) -- delete the entire attestation checkbox card from the quiz content area

### What stays the same
- All quiz logic and state management
- Quiz content and question rendering
- No database changes
- VideoPage.tsx unaffected

### Review
- **Top 5 Risks**: (1) Footer flex alignment across active vs review states. (2) Accessibility labels must be maintained. (3) Removing from QuizModal doesn't affect VideoPage since attestation was non-functional there. (4) No data changes. (5) Minimal risk.
- **Top 5 Fixes**: (1) Delete attestation from QuizModal. (2) Add to DialogFooter with justify-between. (3) Remove Play icon. (4) Update text color. (5) Add Label import.
- **Database Change Required**: No
- **Go/No-Go**: Go

