

## Quiz Progress Saving — Plan

### Analysis

The existing `quiz_attempts` and `quiz_responses` tables are designed for **submitted** quizzes only — `quiz_attempts` auto-scores on insert and `submit_quiz_attempt` marks the video as complete. They cannot be repurposed for in-progress drafts without breaking the completion/scoring integrity.

A **new table** is needed to store draft quiz responses.

### 1. New Database Table: `quiz_draft_responses`

```sql
CREATE TABLE public.quiz_draft_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  quiz_id uuid NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  responses jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (employee_id, quiz_id)
);

ALTER TABLE public.quiz_draft_responses ENABLE ROW LEVEL SECURITY;
```

The `responses` JSONB column stores the array of `{ question_id, selected_option_id?, selected_option_ids?, text_answer? }` objects — matching the existing `ExtendedQuizResponse` shape used in `QuizModal`.

RLS policies: employees can manage their own drafts; admins can view all.

### 2. Service Layer: `quizService.ts`

Add three operations:
- **`saveDraftResponses(email, quizId, responses)`** — upserts draft via a new `SECURITY DEFINER` function (to resolve employee_id from email, matching existing patterns)
- **`getDraftResponses(email, quizId)`** — fetches saved draft
- **`deleteDraftResponses(email, quizId)`** — clears draft after successful quiz submission

### 3. Database Function: `upsert_quiz_draft`

A `SECURITY DEFINER` function that resolves `employee_id` from email (matching the `update_video_progress_by_email` pattern) and upserts into `quiz_draft_responses`.

### 4. Component Changes

**`VideoPlayerFullscreen.tsx`**:
- On quiz load (when `quizStarted` becomes true or auto-starts at 99%), fetch draft responses and pass as `initialDraftResponses` prop to `QuizModal`
- After successful quiz submission (`handleQuizSubmit`), delete the draft
- On `handleConfirmedCancel`, save current quiz responses as draft before closing

**`QuizModal.tsx`**:
- Accept new optional prop `initialDraftResponses` to pre-populate `responses` state
- Call a new `onDraftSave` callback (debounced) whenever `handleResponseChange` fires, so drafts persist as the user selects answers

### 5. Exit Confirmation Dialog Update

**When quiz has been started** (lines 641–661 in `VideoPlayerFullscreen.tsx`):
- Change the dialog description to: *"Your training will remain incomplete but your quiz progress will be saved. You can resume where you left off."*
- Same message for both Cancel button and X/overlay dismissal (both route through `showCancelConfirmation`)

### Files Changed

| File | Change |
|------|--------|
| **Migration SQL** | Create `quiz_draft_responses` table, RLS policies, `upsert_quiz_draft` + `get_quiz_draft` + `delete_quiz_draft` functions, `updated_at` trigger |
| `src/services/quizService.ts` | Add `saveDraft`, `getDraft`, `deleteDraft` operations |
| `src/components/VideoPlayerFullscreen.tsx` | Load draft on quiz start, save draft on cancel, delete draft on submit, update exit dialog copy |
| `src/components/quiz/QuizModal.tsx` | Accept `initialDraftResponses` prop, call `onDraftSave` callback on answer changes |
| `src/types/quiz.ts` | Add `QuizDraftResponse` type |

### Risks

1. **Draft data staleness** — if an admin creates a new quiz version, old drafts reference stale question/option IDs. Mitigated: the `quiz_id` foreign key + `ON DELETE CASCADE` cleans up when old quizzes are deleted; for archived quizzes, drafts are ignored since the quiz ID won't match the active quiz.
2. **Debounce frequency** — saving on every click could be noisy. Will debounce draft saves to ~2 seconds.
3. **RLS complexity** — using `SECURITY DEFINER` functions (matching existing patterns) avoids recursive RLS issues.

### Database Change
**Yes** — new `quiz_draft_responses` table + 3 helper functions.

### Verdict
**Go** — clean separation from the submission tables, follows existing architectural patterns.

