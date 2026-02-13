

## Fix: Button Flash on Reopened Video+Quiz Training

### Problem
When reopening a video training (with quiz) where the video is already at 99%+, the component renders one frame in the "content" footer state showing an enabled "Start Quiz to Complete Training" button. Then the `useEffect` on line 251 fires, sets `quizStarted = true`, and the footer switches to "quiz-active" state with a disabled "Submit Quiz" button. This causes a visible flash/flicker.

### Root Cause
The auto-start quiz effect (lines 251-259) runs after the initial render. During that first render, `quizStarted` is `false` and `progress >= 99` with a quiz present, so the "content" footer shows the enabled "Start Quiz" button momentarily.

### Solution
In the "content" footer state (line 558-620), detect the condition where the auto-start effect is about to fire and suppress the primary button. Specifically, if `progress >= 99 && quiz && !quizLoading && !quizStarted`, the effect will imminently set `quizStarted = true`, so we should hide the primary button (render `null`) to prevent the flash.

### File Changed

**`src/components/VideoPlayerFullscreen.tsx`** -- single change in the content footer zone (around line 610)

Add a guard before rendering the primary button:

```typescript
// If quiz auto-start is imminent, don't render the "Start Quiz" button
const quizAutoStartImminent = !isPresentation && progress >= 99 && quiz && !quizLoading && !quizStarted;

// In the right zone, replace the primary button rendering:
{quizLoading || quizAutoStartImminent ? null : primaryDisabled ? (
  <ButtonWithTooltip ...>
    {primaryLabel}
  </ButtonWithTooltip>
) : (
  <Button ...>
    {primaryLabel}
  </Button>
)}
```

This suppresses the "Start Quiz" button on the single frame before the effect fires, eliminating the flash entirely. No other footer states are affected.

### Review
1. **Top 3 Risks:** (a) None -- guard matches the exact same condition as the auto-start effect. (b) No visual gap since the quiz-active footer renders on the next frame. (c) No impact on other use cases.
2. **Top 3 Fixes:** (a) Eliminates the button flash entirely. (b) Zero new state or complexity. (c) Single-line guard addition.
3. **Database Change:** No.
4. **Verdict:** Go -- minimal, surgical fix.
