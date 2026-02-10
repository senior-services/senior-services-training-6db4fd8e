

## Compliance Timer for Presentation Trainings (Revised)

### What Changes

Replace the current fragmented footer logic with a single unified presentation footer that handles both quiz and no-quiz flows, clean up dead code, and simplify timer constants.

### Current vs. New Behavior

| Aspect | Current | New |
|--------|---------|-----|
| Timer constant | `useCallback` returning 60 | Simple `const PRESENTATION_MIN_SECONDS = 60` |
| Timer display | Removed (empty div left behind) | Clock icon + "Time Remaining: 0:59" in footer left side |
| Footer (no quiz) | Separate block with IIFE timer calc | Unified presentation footer |
| Footer (with quiz) | Uses existing video+quiz footer | Unified presentation footer with "Start Quiz" / "Submit Quiz" toggle |
| Quiz CTA button (line 503) | Shows for all content types | Excluded for presentations (footer handles it) |
| Badge import | Still imported, unused | Removed |

### Detailed Changes

**File: `src/components/VideoPlayerFullscreen.tsx`**

**1. Add constant and imports (top of file)**
- Add `Clock` to Lucide imports
- Remove `Badge` import (line 8) if no longer used elsewhere in the file
- Replace `getMinimumViewingSeconds` callback (lines 126-131) with:
```
const PRESENTATION_MIN_SECONDS = 60;
const isPresentation = video?.content_type === 'presentation';
```

**2. Compute timer values once above the return (near line 131)**
```
const remainingSeconds = isPresentation ? Math.max(0, PRESENTATION_MIN_SECONDS - viewingSeconds) : 0;
const timerActive = remainingSeconds > 0;
const formattedTime = `${Math.floor(remainingSeconds / 60)}:${(remainingSeconds % 60).toString().padStart(2, '0')}`;
```
This eliminates the IIFE in the footer and the duplicated "60" magic number.

**3. Update the timer effect (lines 170-194)**
Replace `getMinimumViewingSeconds()` references with `PRESENTATION_MIN_SECONDS`.

**4. Clean up empty div (lines 534-536)**
Remove the empty space left from the badge removal.

**5. Guard the persistent quiz CTA (lines 503-509)**
Add `&& !isPresentation` to the condition so presentations use the footer button instead.

**6. Remove existing presentation-only footer (lines 670-698)**
Delete the current no-quiz presentation footer block entirely.

**7. Add unified presentation footer (after the existing quiz footer block)**

One single footer for all presentation trainings that are not yet completed:

```
Condition: isPresentation && !wasEverCompleted

Left side:
  [Clock icon] "Time Remaining: 0:59" (or "Review complete" with green text when done)

Right side (depends on state):
  A) Has quiz, quiz NOT started:
     - Cancel (outline, disabled while timer active)
     - "Start Quiz to Complete Training" (primary, disabled while timer active)
     
  B) Has quiz, quiz started:
     - Cancel (outline, triggers cancel confirmation dialog)
     - "Submit Quiz" (primary, disabled until all questions answered + attestation checked)
     
  C) No quiz:
     - Cancel (outline, disabled while timer active)
     - "Complete Training" (primary, disabled until timer=0 AND attestation checked)
```

**8. Wrap existing quiz footer (lines 614-668)**
Add `&& !isPresentation` to its condition so it only renders for video-based trainings, not presentations.

### What stays the same

- The attestation checkbox section (lines 518-560) remains as-is below the presentation
- The quiz section rendering (lines 562-611) remains unchanged
- The quiz attestation block remains unchanged
- The cancel confirmation AlertDialog is reused from the existing code
- The timer `useEffect` logic stays the same (just references the constant instead of the callback)

### Footer layout reference

```text
+------------------------------------------------------------------+
| [Clock] Time Remaining: 0:42  |  Cancel  | Start Quiz / Complete |
+------------------------------------------------------------------+
```

Uses `sm:justify-between` on `DialogFooter` to split left clock from right actions.

### Review

- **Top 5 Risks:** (1) Must ensure existing video+quiz footer is excluded for presentations to avoid double rendering. (2) Quiz start from footer must scroll to quiz section -- reuse existing `handleStartQuiz`. (3) Cancel confirmation flow must stay intact for active quizzes. (4) Timer already stops at 60 via existing effect, no new timer needed. (5) Button state transitions are CSS-only, no performance risk.
- **Top 5 Fixes:** (1) Single unified footer replaces two fragmented blocks. (2) Timer values computed once, not in IIFE. (3) Magic number replaced with named constant. (4) Dead Badge import and empty div removed. (5) Persistent quiz CTA excluded for presentations.
- **Database Change Required:** No
- **Go/No-Go:** Go

