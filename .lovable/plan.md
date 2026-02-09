

## Quiz Review: Badge & Styling Cleanup

### Changes Summary

**File: `src/components/quiz/QuizModal.tsx`**

Three question types need the same set of changes (multiple_choice, true_false, single_answer):

1. **Move icons into badges**: Replace the current plain-text badges (e.g., "Correct", "Incorrect", "Also Correct") with badges that include an icon. Use `showIcon` prop on the Badge component:
   - "Correct" / "Also Correct" badges: use `variant="soft-success"` with `showIcon` (renders a checkmark icon inside the badge)
   - "Incorrect" badges: use `variant="soft-destructive"` with `showIcon` (renders a warning icon inside the badge)

2. **Remove standalone icons**: Delete all the separate `<CheckCircle>` and `<XCircle>` icon elements that currently appear to the right of the badges (lines 322-331, 411-420, 493-502 and their equivalents).

3. **Remove banner styling for non-user-selected answers**: For options the user did NOT select, remove the colored background/border styling (`bg-success/10 border-success/20 rounded-md p-3 border`) so they appear as plain text. The badge alone ("Correct" or "Also Correct") will still communicate the answer status.
   - Specifically, the `else if (!isSelected && isCorrect && ...)` branches that add banner classes will be removed.
   - The badge for those unselected-but-correct options will remain.

### What Stays the Same
- Banner styling for user-selected answers (green for correct, red for incorrect) remains unchanged
- Badge text labels ("Correct", "Incorrect", "Also Correct") remain unchanged
- True/False inline icons (small CheckCircle/XCircle next to "True"/"False" text) are unrelated decorative icons and remain unchanged
- No database or schema changes

### Technical Details

| Section | Current | After |
|---|---|---|
| Selected correct answer | Green banner + "Correct" badge + CheckCircle icon | Green banner + "Correct" badge with built-in icon |
| Selected incorrect answer | Red banner + "Incorrect" badge + XCircle icon | Red banner + "Incorrect" badge with built-in icon |
| Unselected correct answer | Green banner + "Correct"/"Also Correct" badge + CheckCircle icon | No banner + "Correct"/"Also Correct" badge with built-in icon |

### Review
- **Top 5 Risks**: (1) Badge `showIcon` uses `Check` not `CheckCircle` and `AlertTriangle` not `XCircle` -- slightly different icons but consistent with design system. (2) No accessibility impact -- ARIA labels on badges preserved. (3) No data changes. (4) No logic changes. (5) Minimal risk overall.
- **Top 5 Fixes**: (1) Add `showIcon` and `variant="soft-success"/"soft-destructive"` to badges. (2) Remove standalone icon elements. (3) Remove banner styling on non-selected options. (4) Apply consistently across all three question types. (5) Remove unused custom `className` overrides on badges now using proper variants.
- **Database Change Required**: No
- **Go/No-Go**: Go

