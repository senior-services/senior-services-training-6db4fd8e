

## Final Layout and Compliance Correction

### Changes (single file: `src/components/VideoPlayerFullscreen.tsx`)

---

### Change A -- Restore top padding on scrollable div (line 435)

Revert `px-6 pb-6 pt-0` back to `p-6`:

```tsx
// Before
className="flex-1 overflow-y-auto min-h-0 w-full px-6 pb-6 pt-0 flex flex-col gap-6"

// After
className="flex-1 overflow-y-auto min-h-0 w-full p-6 flex flex-col gap-6"
```

This restores the 24px top gap between the header border and the first content element (description or video).

---

### Change B -- Wrap both existing footers in `!wasEverCompleted` guard (lines 488-649)

Both `DialogFooter` blocks should only render when the training is not already completed. The presentation footer (line 547) already has `!wasEverCompleted`. The quiz footer (line 489) partially handles it internally but still renders a "Close" button when `wasEverCompleted`. Wrap the entire quiz footer in the same guard:

```tsx
// Before (line 489)
{quiz && !isPresentation && (quizStarted || quizSubmitted || wasEverCompleted) && <DialogFooter>

// After
{quiz && !isPresentation && !wasEverCompleted && (quizStarted || quizSubmitted) && <DialogFooter>
```

This removes the footer entirely once training is marked complete -- no "Close" button lingers. Users close via the dialog's X button.

---

### Change C -- Add a universal "Close" footer for completed trainings (after line 649)

Add a simple footer that renders for any completed training (video, presentation, or quiz) so there is always a visible close action:

```tsx
{wasEverCompleted && (
  <DialogFooter>
    <div className="flex w-full items-center justify-end">
      <DialogClose asChild>
        <Button>Close</Button>
      </DialogClose>
    </div>
  </DialogFooter>
)}
```

Wait -- the user said: "If the training is already marked as Completed, the footer should be completely removed from the DOM." This means no footer at all for completed trainings. So Change C is **not needed**. The user explicitly wants the footer gone when completed.

Let me revise: For **non-completed** trainings, we need footers for all types. Currently missing is a footer for plain videos without quizzes. Let me check -- plain videos use the `CompletionOverlay` which has its own "Complete Training" button inline. So the footer gap is intentional for plain videos mid-watch. Once the overlay appears, it handles completion. No separate footer needed.

**Revised Change C**: No new footer block. The two existing footers cover all active (non-completed) scenarios:
- Quiz footer: handles video+quiz and presentation+quiz (when quiz is started)
- Presentation footer: handles presentation-only and presentation+quiz (pre-quiz phase)
- Plain video: uses `CompletionOverlay` inline, no footer needed

---

### Change D -- DialogHeader border verification (line 428)

The `DialogHeader` currently has no className override, inheriting the primitive defaults which include `border-b`. Confirm this is already present in the primitive. No code change needed -- the primitive in `dialog.tsx` defines `border-b` in the base class.

---

### Summary

| Area | Change |
|------|--------|
| Scrollable div | `pt-0` restored to `p-6` for uniform 24px gutters |
| Quiz footer (line 489) | Guard tightened: add `!wasEverCompleted`, remove `wasEverCompleted` from condition |
| Presentation footer (line 547) | Already has `!wasEverCompleted` -- no change |
| Plain video footer | Not needed -- `CompletionOverlay` handles it inline |
| DialogHeader | No change -- primitive defaults include `border-b` |

### Review

1. **Top 3 Risks:** (a) Completed trainings will have no footer at all -- users must use the X button to close. This matches the user's explicit request. (b) Restoring `p-6` adds 24px above the first content element; if the header already provides 16px bottom padding, total gap is 40px. This is the user's stated preference. (c) Plain videos without quizzes still rely on the CompletionOverlay for the "Complete" action -- no fixed footer button.
2. **Top 3 Fixes:** (a) Uniform 24px content gutters restored. (b) Completed trainings have a clean, footer-free view. (c) No styling overrides on primitives.
3. **Database Change:** No.
4. **Verdict:** Go.
