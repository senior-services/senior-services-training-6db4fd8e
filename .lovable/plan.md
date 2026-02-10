

## Quiz Cancel and Reopen: Revised Plan

### Goal
When a user cancels a quiz (whether or not they've made selections), a confirmation prompt always appears. Confirming the cancel closes the entire training dialog. Reopening the training automatically shows a fresh quiz.

### Updated Cancel Behavior

| Scenario | Confirmation Title | Description | Actions |
|----------|-------------------|-------------|---------|
| Quiz visible, no selections | "Exit training?" | "You haven't finished the quiz yet. You'll need to submit it to mark this training as complete." | "Continue Quiz" / "Exit Quiz" |
| Quiz visible, has selections | "Discard unsaved progress?" | "If you leave now, your answers won't be saved and your training will remain incomplete." | "Keep editing" / "Discard & Exit" |

Both exit actions close the training dialog and clear quiz state. On reopen, the user sees a fresh quiz automatically.

---

### Changes (2 files)

#### File 1: `src/hooks/useVideoProgress.ts`

**Line 202** -- Return `progressPercent` alongside `completedAt` so the caller can detect a fully-watched-but-not-completed video:

Current:
```ts
return { completedAt: progressData.completed_at || null };
```
Updated:
```ts
return { completedAt: progressData.completed_at || null, progressPercent };
```

Also update the fallback on **line 206**:
```ts
return { completedAt: null, progressPercent: 0 };
```

---

#### File 2: `src/components/VideoPlayerFullscreen.tsx`

**Change A -- Initialization (lines 162-165):**
After `loadExistingProgress`, if progress is 99%+ and not completed, pre-set `overlayDismissed = true` to suppress the completion overlay and allow the auto-quiz effect to fire on reopen:

```ts
if (user?.email) {
  const result = await loadExistingProgress();
  if (result && !result.completedAt && result.progressPercent >= 99) {
    setOverlayDismissed(true);
  }
}
```

**Change B -- Auto-quiz effect (lines 258-269):**
Flip the guard so it fires when `overlayDismissed` is true (return user with fully-watched video), instead of requiring it to be false:

Current guard:
```ts
if (!open || quizStarted || wasEverCompleted || overlayDismissed) return;
```
Updated guard:
```ts
if (!open || quizStarted || wasEverCompleted || !overlayDismissed) return;
```

**Change C -- `handleCancelClick` (lines 414-428):**
Always show confirmation, removing the no-changes shortcut:

```ts
const handleCancelClick = useCallback(() => {
  if (quizSubmitted) {
    setQuizStarted(false);
    setShowCompletionOverlay(true);
    return;
  }
  setShowCancelConfirmation(true);
}, [quizSubmitted]);
```

**Change D -- `handleConfirmedCancel` (lines 431-441):**
Clear all quiz state and close the entire dialog:

```ts
const handleConfirmedCancel = useCallback(() => {
  setShowCancelConfirmation(false);
  setQuizStarted(false);
  setQuizResponses([]);
  setAllQuestionsAnswered(false);
  setHasQuizChanges(false);
  setQuizSubmitted(false);
  setQuizResults([]);
  setCompletedQuizResults([]);
  setQuizAttestationChecked(false);
  onOpenChange(false);
}, [onOpenChange]);
```

**Change E -- Confirmation dialog copy (lines 644-658):**
Replace static text with conditional copy based on `hasQuizChanges`:

```tsx
<AlertDialogContent>
  <AlertDialogHeader>
    <AlertDialogTitle>
      {hasQuizChanges ? 'Discard unsaved progress?' : 'Exit training?'}
    </AlertDialogTitle>
  </AlertDialogHeader>
  <div>
    <AlertDialogDescription>
      {hasQuizChanges
        ? "If you leave now, your answers won't be saved and your training will remain incomplete."
        : "You haven't finished the quiz yet. You'll need to submit it to mark this training as complete."}
    </AlertDialogDescription>
  </div>
  <AlertDialogFooter>
    <AlertDialogCancel>
      {hasQuizChanges ? 'Keep editing' : 'Continue Quiz'}
    </AlertDialogCancel>
    <AlertDialogAction onClick={handleConfirmedCancel}>
      {hasQuizChanges ? 'Discard & Exit' : 'Exit Quiz'}
    </AlertDialogAction>
  </AlertDialogFooter>
</AlertDialogContent>
```

---

### How It All Fits Together

1. User watches video to 100%, sees overlay, starts quiz
2. User clicks Cancel -- confirmation always appears (different copy depending on whether they made selections)
3. "Continue Quiz" / "Keep editing" -- closes the confirmation, returns to quiz with state intact
4. "Exit Quiz" / "Discard & Exit" -- closes the entire training dialog, clears quiz state
5. User reopens training -- `loadExistingProgress` returns 99%+ progress with no `completedAt`
6. Initialization sets `overlayDismissed = true`, auto-quiz effect fires, user sees fresh quiz immediately

### Technical Summary

| File | Lines | Change |
|------|-------|--------|
| `useVideoProgress.ts` | 202, 206 | Return `progressPercent` in result object |
| `VideoPlayerFullscreen.tsx` | 162-165 | Pre-set `overlayDismissed` if DB progress >= 99% and not completed |
| `VideoPlayerFullscreen.tsx` | 260 | Flip auto-quiz guard to `!overlayDismissed` |
| `VideoPlayerFullscreen.tsx` | 414-428 | Always show confirmation on cancel |
| `VideoPlayerFullscreen.tsx` | 431-441 | Clear state + close dialog on confirmed cancel |
| `VideoPlayerFullscreen.tsx` | 644-658 | Two-path conditional title, description, and button labels |

### Review

- **Top 5 Risks**: (1) Both cancel paths now require confirmation -- matches the stated requirement that quizzes are mandatory. (2) "Keep editing" / "Continue Quiz" preserves quiz state correctly since `AlertDialogCancel` only closes the confirmation. (3) First-time video watch is unaffected -- `overlayDismissed` is only pre-set from DB-loaded progress >= 99%. (4) Submitted/review cancel path (lines 415-419) is untouched. (5) No security or data impact.
- **Top 5 Fixes**: (1) Return `progressPercent` from hook. (2) Pre-set `overlayDismissed` during initialization. (3) Flip auto-quiz guard direction. (4) Always show confirmation on cancel. (5) Two-path conditional dialog copy.
- **Database Change Required**: No
- **Go/No-Go**: Go
