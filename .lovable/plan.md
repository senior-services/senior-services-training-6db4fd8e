

## Bug Fix: Quiz Draft Attestation Not Restored on Reopen

### Root Cause Analysis

Two issues combine to create this bug:

1. **`allQuestionsAnswered` is never set to `true` on draft restore.** The `TrainingAttestation` component in the quiz flow uses `enabled={allQuestionsAnswered}` (line 645). This state is only updated when `QuizModal` calls `onResponsesChange` — but that callback is only triggered inside `handleResponseChange`, which fires on user interaction. When drafts are loaded on mount, no `onResponsesChange` call is made, so `allQuestionsAnswered` stays `false`, keeping the checkbox disabled.

2. **Attestation checkbox state is not saved/restored with drafts.** The `quizAttestationChecked` state is never persisted to the draft, so even if the checkbox was checked before closing, it always starts as `false` on reopen.

### Plan

**1. `src/components/quiz/QuizModal.tsx` — Fire `onResponsesChange` on mount when drafts are loaded**

Add a `useEffect` that runs after initial render. When `initialDraftResponses` are present (and quiz is not submitted), compute the response array and `allAnswered` status, then call `onResponsesChange` with the initial attestation state. This ensures the parent (`VideoPlayerFullscreen`) gets the correct `allQuestionsAnswered` value immediately.

Also, initialize `attestationChecked` from `initialDraftResponses` metadata (see change #2 below).

**2. `src/types/quiz.ts` — Add `attestation_checked` field to `QuizDraftResponse`**

Add an optional `attestation_checked?: boolean` field. This will be stored as a metadata flag on the first draft entry (piggyback approach) to avoid schema changes.

**3. `src/components/VideoPlayerFullscreen.tsx` — Save and restore attestation state in drafts**

- **Save (line ~484-488, `handleConfirmedCancel`):** Include `attestation_checked: quizAttestationChecked` on the first draft entry when saving on cancel.
- **Save (line ~448-454, `handleDraftSave`):** Include `attestation_checked: quizAttestationChecked` on drafts passed from QuizModal.
- **Restore (line ~322-341 and ~424-445):** After loading draft, check for `attestation_checked` on the first entry and pre-set `quizAttestationChecked`.

**4. `src/components/quiz/QuizModal.tsx` — Initialize attestation from draft**

Change line 108 to also check `initialDraftResponses` for an `attestation_checked` flag:

```ts
const [attestationChecked, setAttestationChecked] = useState(
  isSubmitted ? true : (initialDraftResponses?.[0]?.attestation_checked ?? false)
);
```

Add a `useEffect` to call `onResponsesChange` on mount with draft-initialized state so the parent receives `allQuestionsAnswered` and `attestationChecked` immediately.

### Files Changed

| File | Change |
|------|--------|
| `src/types/quiz.ts` | Add `attestation_checked?: boolean` to `QuizDraftResponse` |
| `src/components/quiz/QuizModal.tsx` | Init attestation from draft; fire `onResponsesChange` on mount with draft data |
| `src/components/VideoPlayerFullscreen.tsx` | Include attestation state when saving drafts; restore on load |

### Database Change
**No.** The `attestation_checked` boolean is stored inside the existing `responses` JSONB column, piggybacked onto the draft entries.

