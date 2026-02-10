

## Auto-Show Quiz When Reopening After Video Completion

### Problem
When an employee watches a training video to 100% (with a quiz attached), sees the completion overlay, then closes the dialog, reopening it shows the completion overlay again with the "Start Quiz..." button. This is an unnecessary extra click -- the quiz should display automatically.

### Solution
In `VideoPlayerFullscreen.tsx`, when the dialog opens and existing progress is loaded at 99%+ with a quiz present and the training is not yet completed, skip the completion overlay and go directly to the quiz.

### Changes (1 file)

**`src/components/VideoPlayerFullscreen.tsx`**

In the `useEffect` that initializes the video (lines ~137-168), after `loadExistingProgress()` resolves, check if progress is 99%+ AND a quiz exists AND `wasEverCompleted` is false. If so, set `quizStarted = true` and `overlayDismissed = true` to bypass the overlay entirely.

Specifically, add a post-load check after `loadExistingProgress()`:

```tsx
// After loading existing progress, auto-start quiz if video was fully watched
if (user?.email) {
  await loadExistingProgress();
}

// Auto-show quiz if video is fully watched but training not yet completed
// This handles the case where the user closes and reopens the dialog
```

A new state flag or a simple check on progress after load will trigger `setQuizStarted(true)` and `setOverlayDismissed(true)` so the overlay effect (lines 244-256) never fires.

Since `loadExistingProgress` sets progress synchronously via `setProgress`, and the quiz/video data may still be loading, we need to use a secondary effect that watches for the combination of: progress >= 99, quiz loaded (non-null), not completed, and dialog open. This avoids race conditions with async data loading.

**New effect (after the overlay effect at line ~256):**
```tsx
// Auto-start quiz when reopening dialog with video already fully watched
useEffect(() => {
  if (!open || quizStarted || wasEverCompleted || overlayDismissed) return;
  if (progress >= 99 && quiz && !quizLoading) {
    setQuizStarted(true);
    setOverlayDismissed(true);
    setShowCompletionOverlay(false);
    setTimeout(() => {
      document.getElementById('quiz-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }
}, [open, progress, quiz, quizLoading, quizStarted, wasEverCompleted, overlayDismissed]);
```

This effect fires once all data is ready and will auto-navigate to the quiz section, skipping the overlay.

### Review
- **Top 5 Risks**: (1) Effect could fire during initial video watch -- mitigated by `overlayDismissed` guard which is set when user first sees overlay. On fresh watch, the overlay shows first; on reopen, `progress` is already 99% from DB load so quiz shows immediately. (2) Race condition with async quiz loading -- mitigated by `quizLoading` guard. (3) No impact on completed trainings since `wasEverCompleted` blocks the effect. (4) No database changes. (5) No security impact.
- **Top 5 Fixes**: (1) Add a new useEffect to auto-start quiz on dialog reopen with 99%+ progress. No other changes needed.
- **Database Change Required**: No
- **Go/No-Go**: Go

