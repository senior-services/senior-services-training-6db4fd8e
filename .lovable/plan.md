

## Add "Save Quiz?" Confirmation for First-Time Unassigned Quiz Save

### Where It Applies

Only in `EditVideoModal.tsx` — when an admin adds a quiz to an existing training that has **no assignments** and **no existing quiz**. The condition is: `isCreatingNewQuiz === true && !hasAssignments`.

Trainings that already have assignments show the versioning banner instead, so no overlap.

### Changes — `src/components/EditVideoModal.tsx`

1. **New state**: `saveQuizConfirmDialogOpen` (boolean, default `false`)

2. **Modify `handleSave`** (line ~400): Before calling `performSave(false)`, check if `isCreatingNewQuiz && !hasAssignments`. If true, set `saveQuizConfirmDialogOpen = true` and return early (wait for confirmation). Otherwise proceed as-is.

3. **New handler**: `handleSaveQuizConfirm` — closes the dialog and calls `performSave(false)`.

4. **New AlertDialog** (after the existing Version Confirmation Dialog, ~line 1557):

   - **Title**: "Save Quiz?"
   - **Description**: "Your quiz will be saved. You may continue making changes until this training is assigned to employees. Once assigned, any future edits will automatically be saved as a new version to ensure accurate completion records."
   - **Cancel button**: "Cancel" — returns to editor
   - **Action button**: "Save Quiz" — calls `handleSaveQuizConfirm`

### Files Changed

| File | Change |
|------|--------|
| `src/components/EditVideoModal.tsx` | Add confirmation state, guard in `handleSave`, new AlertDialog |

### Database Change
**No.**

