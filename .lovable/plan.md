

## Fix: Training Auto-Completing Without Attestation

### Problem
When a video without a quiz reaches 100% progress, the system automatically marks the training as complete in the database, bypassing the mandatory attestation checkbox.

### Fix (1 file)

**File: `src/hooks/useVideoProgress.ts`** (line 49)

Change the completion condition so that reaching 100% progress alone never auto-completes a training. Only explicit calls to `markComplete()` (after attestation) should set `completed_at`.

Current logic:
```
const shouldComplete = progressPercent >= 100 && (!hasQuiz || forceComplete);
```

Fixed logic:
```
const shouldComplete = progressPercent >= 100 && forceComplete === true;
```

### What This Means
- Videos can still save 100% watched progress to the database
- Training is only marked "complete" after the user checks the attestation checkbox and clicks "Complete Training"
- Quiz flow is unaffected (quiz submission already calls `markComplete()` explicitly)
- If a user closes and reopens the dialog, their progress is restored and the attestation prompt reappears

### Review
- **Top 5 Risks**: (1) Existing completions unaffected -- forward-only change. (2) Quiz flow still works since `handleQuizSubmit` calls `markComplete()`. (3) Progress shows 100% but not "Completed" until attestation -- correct behavior. (4) Google Drive time-based videos use same path -- fix applies correctly. (5) Presentations use separate flow -- unaffected.
- **Top 5 Fixes**: (1) Change `shouldComplete` to require `forceComplete === true`. (2-5) No other changes needed.
- **Database Change Required**: No
- **Go/No-Go**: Go

