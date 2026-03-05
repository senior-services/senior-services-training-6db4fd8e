

## Fix: Resume Position Not Persisting on Dialog Close

### Root Causes Identified

**Issue 1: `resetProgress()` clears everything on dialog close.** In the `useEffect` at line 140, when `open` becomes `false`, `resetProgress()` is called which zeros out `lastPositionRef.current` and `furthestWatchedRef.current`. This happens *before* any final write to the database, so the last position is lost.

**Issue 2: No immediate write on dialog close.** The debounced progress writes may be pending when the user closes the dialog, but `resetProgress()` calls `clearTimeout(progressUpdateTimeoutRef.current)`, cancelling the pending write. There is no "flush on close" logic.

**Issue 3: Misleading cancel dialog message.** Line 696 says "Your progress will not be saved" which is inaccurate — video progress (position, furthest point) IS saved. Only the completion status remains incomplete.

### Changes

**1. `src/hooks/useVideoProgress.ts`**
- Add a `flushLastPosition` callback that immediately writes the current `lastPositionRef.current` and `furthestWatchedRef.current` to the database (bypassing the debounce). This should be called before `resetProgress`.
- Expose `flushLastPosition` in the return value.

**2. `src/components/VideoPlayerFullscreen.tsx`**
- In the `useEffect` that handles `!open` (line 140-153), call `flushLastPosition()` before `resetProgress()` so the last position is persisted before state is cleared.
- In `handleConfirmedCancel` (line 446), call `flushLastPosition()` before `onOpenChange(false)`.
- In `handleDialogOpenChange` (line 459), when the dialog is closing via X/overlay and we confirm exit, ensure `flushLastPosition()` fires.
- Update the cancel dialog description at line 694-696: change the `!contentDone` message from "Your progress will not be saved and your training will remain incomplete." to "Your training will remain incomplete but your video progress will be saved. You can resume where you left off."

### Files Changed

| File | Change |
|------|--------|
| `src/hooks/useVideoProgress.ts` | Add `flushLastPosition` method that writes current refs to DB immediately |
| `src/components/VideoPlayerFullscreen.tsx` | Call `flushLastPosition()` before `resetProgress()` on close; update cancel dialog message text |

### Database Change
**No** — The schema and RPC function already support `last_position_seconds`. The issue is purely client-side timing.

