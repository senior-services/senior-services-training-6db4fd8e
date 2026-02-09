

## Quiz Review Dialog: Header, Description & Attestation Layout Changes

### Changes Summary

**3 changes across 2 files:**

### 1. Remove Play icon from dialog header
**File: `src/components/VideoPlayerFullscreen.tsx` (line 482)**
- Remove the `<Play>` icon element from the `DialogTitle`
- Keep the video title text as-is

### 2. Change video description to primary text color
**File: `src/components/VideoPlayerFullscreen.tsx` (line 489)**
- Change `text-muted-foreground` to `text-foreground` on the description paragraph

### 3. Move attestation checkbox to dialog footer
**File: `src/components/quiz/QuizModal.tsx` (lines 486-524)**
- Remove the entire attestation checkbox block from QuizModal (the bordered card with checkbox and label at the bottom of the quiz content area)

**File: `src/components/VideoPlayerFullscreen.tsx` (lines 575-610)**
- Restructure the `DialogFooter` to use `justify-between` layout
- Add the attestation checkbox + label on the left side of the footer, vertically aligned with the Close/Submit button on the right
- For the active quiz state (not yet submitted): attestation on the left, Cancel + Submit buttons on the right
- For the review state (already completed): attestation (checked, disabled) on the left, Close button on the right
- The attestation state management already exists in VideoPlayerFullscreen (`quizAttestationChecked` state + `handleQuizResponsesChange` callback), so the footer will use those existing values

### What Stays the Same
- Attestation logic and state management (already handled in VideoPlayerFullscreen)
- Quiz content rendering (questions, options, badges)
- No database changes
- VideoPage.tsx quiz dialog is unaffected (it does not use the same fullscreen layout)

### Technical Details

| Change | Before | After |
|---|---|---|
| Dialog header | Play icon + title | Title only |
| Description color | `text-muted-foreground` (gray) | `text-foreground` (primary/dark) |
| Attestation location | Inside QuizModal scroll area (card) | Dialog footer, left-aligned beside Close button |

### Review
- **Top 5 Risks**: (1) Removing attestation from QuizModal may affect VideoPage.tsx which also uses QuizModal -- but VideoPage does not use `onResponsesChange` so attestation was non-functional there anyway. (2) Footer layout needs careful flex alignment for different states. (3) Attestation checkbox accessibility must be maintained with proper labels. (4) No data or logic changes. (5) Minimal risk overall.
- **Top 5 Fixes**: (1) Delete attestation block from QuizModal. (2) Add attestation to DialogFooter with `justify-between` layout. (3) Remove Play icon from DialogTitle. (4) Update description text color class. (5) Ensure consistent spacing between attestation and buttons.
- **Database Change Required**: No
- **Go/No-Go**: Go

