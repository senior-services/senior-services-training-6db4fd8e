

# Quiz Results Heading -- Use H3 Bold

## What changes

Change the "Quiz Results" text from a `<span>` to an `<h3>` element with bold styling for proper semantic heading hierarchy.

## How

**File: `src/components/quiz/QuizScoreSummary.tsx`** (line 41)

Replace:
```tsx
<span className="font-semibold text-sm">Quiz Results</span>
```

With:
```tsx
<h3 className="font-bold text-sm">Quiz Results</h3>
```

| Item | Detail |
|---|---|
| Files changed | 1 |
| Lines changed | 1 |
| Risk | Minimal |

