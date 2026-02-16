

## Fix: Attestation Pushed to Bottom by QuizModal's `h-full`

### Root Cause

`QuizModal.tsx` line 201 has `className="h-full overflow-y-auto"` on its root container. The `h-full` stretches the quiz to fill the entire height of `#quiz-section`, which pushes the sibling `TrainingAttestation` block to the very bottom of the scroll area -- creating a large gap between the last question and the acknowledgment.

The `overflow-y-auto` is also unnecessary here because scrolling is handled by the parent `DialogScrollArea` in the fullscreen dialog.

### Fix (1 file: `src/components/quiz/QuizModal.tsx`)

**Line 201** -- Remove `h-full` and `overflow-y-auto` from the root container:

```tsx
// Before
<div className="h-full overflow-y-auto">

// After
<div>
```

That is the only change needed. The attestation will then sit naturally after the quiz content with the `mt-6` spacing already applied.

### Review

1. **Top 3 Risks**: (a) `QuizModal` may also render inside a standalone dialog elsewhere -- removing `h-full` should be harmless there too since the dialog's own scroll handles overflow. (b) Removing `overflow-y-auto` is safe because the parent scroll container already manages scrolling. (c) No logic changes.
2. **Top 3 Fixes**: (a) Removes the single class causing the gap. (b) One-line change with no side effects. (c) Attestation will flow inline with consistent `mt-6` spacing.
3. **Database Change**: No.
4. **Verdict**: Go -- single class removal on line 201.

