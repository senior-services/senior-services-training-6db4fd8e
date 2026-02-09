

## Fix Extra Margin on Helper Text

### Problem
The helper text appears with extra spacing because it sits as a separate child element inside a parent container that uses `space-y-3` (admin) or `space-y-4` (employee). Tailwind's `space-y-*` utility adds top margin to every child after the first, so removing `mt-1` from the `<p>` tag had no visible effect -- the parent's spacing class overrides it.

### Solution
Wrap the Label and its helper text together in a single `<div>` so they are treated as one child by the parent's `space-y` layout. This eliminates the automatic gap between them while keeping the gap between the grouped label/helper and the next sibling (input options).

### Changes (3 files)

**File 1: `src/components/EditVideoModal.tsx`** (~line 1124-1129)
- Wrap `<Label>Answer Options</Label>` and the conditional helper `<p>` in a single `<div>`:
```tsx
<div>
  <Label>Answer Options</Label>
  {question.question_type === 'multiple_choice' && (
    <p className="text-xs text-muted-foreground mb-1.5">
      Mark all correct answers. Employees must select all of these to pass the question.
    </p>
  )}
</div>
```

**File 2: `src/components/quiz/CreateQuizModal.tsx`** (~line 303-307)
- Same wrapping approach for the Label and helper text.

**File 3: `src/components/quiz/QuizModal.tsx`** (~line 226-234)
- Wrap the `<h3>` question title and the conditional helper `<p>` in a single `<div>`:
```tsx
<div>
  <h3 className="font-semibold text-lg">
    {index + 1}. {question.question_text}
  </h3>
  {question.question_type === 'multiple_choice' && (
    <p className="text-xs text-muted-foreground">
      Select all correct options for full credit.
    </p>
  )}
</div>
```

### Review
- **Top 5 Risks**: (1) Minimal -- structural wrapper only, no logic changes. (2) Must verify wrapping doesn't break existing layout for non-multiple-choice types. (3) No styling regressions. (4) No database changes. (5) No accessibility impact.
- **Top 5 Fixes**: (1) Wrap label + helper in EditVideoModal. (2) Wrap label + helper in CreateQuizModal. (3) Wrap title + helper in QuizModal. (4) Preserves parent space-y gaps for other siblings. (5) Consistent pattern across all three files.
- **Database Change Required**: No
- **Go/No-Go**: Go
