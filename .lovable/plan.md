

## Bug: Attestation Disappears on Dialog Reopen

### Root Cause

**Debounce race condition in `useVideoProgress.ts`.**

When a video ends:
1. `handleVideoEnded` calls `updateProgress(99)`
2. `updateProgress` debounces the DB write by 1 second (line 127)
3. User closes the dialog within that 1 second
4. `resetProgress()` fires on close and **cancels the pending timeout** (line 157-158)
5. The 99% progress is never written to the database
6. On reopen, `loadExistingProgress` returns the old value (e.g., 85%), so `videoReady` (`progress >= 99`) is false and the attestation section doesn't render

### Fix

**`src/hooks/useVideoProgress.ts`** — Skip debouncing when progress reaches 99% or higher. This ensures the "video finished" state is immediately persisted and cannot be lost on dialog close.

In `updateProgress` (line 106), after the `Math.max` state update, add a condition: if `cappedProgress >= 99`, call `updateProgressToDatabase(cappedProgress)` immediately instead of going through the 1-second debounce. The debounce path remains for normal incremental progress updates (e.g., 10%, 25%, 50%).

```typescript
// Line ~122: After setProgress
if (cappedProgress >= 99) {
  // Critical milestone — write immediately, no debounce
  if (progressUpdateTimeoutRef.current) {
    clearTimeout(progressUpdateTimeoutRef.current);
    progressUpdateTimeoutRef.current = undefined;
  }
  updateProgressToDatabase(cappedProgress);
} else {
  // Normal progress — debounce
  if (progressUpdateTimeoutRef.current) {
    clearTimeout(progressUpdateTimeoutRef.current);
  }
  progressUpdateTimeoutRef.current = setTimeout(() => {
    updateProgressToDatabase(cappedProgress);
  }, 1000);
}
```

### Files Changed

| File | Change |
|------|--------|
| `src/hooks/useVideoProgress.ts` | Immediate DB write when progress >= 99 |

### Review
1. **Top 3 Risks**: (a) Slightly more DB writes at the 99% boundary — negligible since it fires once per video watch. (b) None. (c) None.
2. **Top 3 Fixes**: (a) Guarantees 99% progress is persisted before dialog close. (b) Attestation section correctly renders on reopen. (c) No changes to UI components needed.
3. **Database Change**: No.
4. **Verdict**: Go — single-line conditional, surgical fix.

