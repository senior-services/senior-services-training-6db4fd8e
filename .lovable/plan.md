

## Add Diagnostic Console Logs for Quiz Draft Attestation Bug

Temporary `console.log` statements at key points to trace why `allQuestionsAnswered` stays `false` when drafts are restored.

### Changes

**1. `src/components/quiz/QuizModal.tsx`**

- **On mount (inside the draft-restore `useEffect`, ~line 114):** Log `initialDraftResponses`, the computed `allAnswered` boolean, and `attestation_checked` read from draft.
- **Before `onResponsesChange` call (~line 150):** Log the payload being sent to the parent.
- **At render time (~line 267):** Log the `allQuestionsAnswered` computed value (line 254) and `attestationChecked` state on every render (guarded to avoid spam — only when quiz is active).

**2. `src/components/VideoPlayerFullscreen.tsx`**

- **Inside `handleQuizResponsesChange` (~line 468):** Log the received `allAnswered` and `attestationChecked` values.
- **At the TrainingAttestation render (~line 661):** Log the `allQuestionsAnswered` and `quizAttestationChecked` state values being passed as props.
- **In the auto-start draft load effect (~line 326):** Log the loaded draft and attestation value.

### Files Changed

| File | Change |
|------|--------|
| `src/components/quiz/QuizModal.tsx` | Add ~4 `console.log` statements |
| `src/components/VideoPlayerFullscreen.tsx` | Add ~3 `console.log` statements |

### Suspicion

There's a potential race condition: `handleStartQuiz` (line 428-453) explicitly resets `setQuizAttestationChecked(false)` at line 446 **after** restoring it at line 436. If the "Start Quiz" button path is used instead of the auto-start effect, the attestation is always clobbered. The logs will confirm which path is taken on reopen and whether the mount effect in QuizModal fires at all.

