

## Fix: Move Attestation Inside Quiz Container for Consistent Spacing

### Problem
The attestation section sits **outside** the quiz container (`#quiz-section`) as a separate sibling with `mt-6 max-w-4xl mx-auto`. Meanwhile, the quiz questions use `space-y-6` for inter-question spacing inside `QuizModal`. This structural mismatch causes the attestation to appear detached -- either with excessive spacing or forced to the bottom.

### Fix (1 file: `src/components/VideoPlayerFullscreen.tsx`)

**Move the attestation block inside the `#quiz-section` container**, directly after `QuizModal`, and match the quiz's `space-y-6` spacing.

**Lines 569-594 -- Before:**
```tsx
<div id="quiz-section" className="mt-8 border-t pt-8 pb-10">
  <QuizModal ... />
</div>

{/* Attestation - below quiz questions */}
{quiz && (quizStarted || ...) && (
  <div className="mt-6 max-w-4xl mx-auto">
    <TrainingAttestation ... />
  </div>
)}
```

**After:**
```tsx
<div id="quiz-section" className="mt-8 border-t pt-8 pb-10">
  <QuizModal ... />

  {/* Attestation - inline after quiz questions */}
  {!quizSubmitted && !wasEverCompleted && (
    <div className="mt-6 max-w-4xl mx-auto">
      <TrainingAttestation
        enabled={allQuestionsAnswered}
        checked={quizAttestationChecked}
        onCheckedChange={setQuizAttestationChecked}
        disabledTooltip="Complete the questions above to enable this checkbox."
      />
    </div>
  )}
</div>
```

Key changes:
- The attestation `div` moves **inside** `#quiz-section`, becoming a direct sibling of `QuizModal`
- The outer conditional `quiz && (quizStarted || quizSubmitted || wasEverCompleted)` is no longer needed because the attestation is already inside the quiz section block which has the same guard
- `mt-6` matches the `space-y-6` gap between quiz question cards
- `max-w-4xl mx-auto` matches `QuizModal`'s inner layout
- The old standalone attestation block (lines 584-594) is removed entirely

### Review

1. **Top 3 Risks**: (a) None -- attestation visibility conditions are preserved. (b) No logic changes, only DOM nesting. (c) `pb-10` on the quiz container still provides footer clearance.
2. **Top 3 Fixes**: (a) Attestation flows inline with quiz questions. (b) Consistent `mt-6` spacing matches inter-question gap. (c) Single container eliminates structural mismatch.
3. **Database Change**: No.
4. **Verdict**: Go -- move one block inside its parent container.
