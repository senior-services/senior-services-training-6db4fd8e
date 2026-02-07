

# Fix Quiz Results Heading Font Size

## What changes

Update the `<h3>` "Quiz Results" heading font size from `text-sm` (15px) to `text-2xl` (24px) to match the component gallery guidelines.

## How

**File: `src/components/quiz/QuizScoreSummary.tsx`** (line 41)

Replace:
```tsx
<h3 className="font-bold text-sm">Quiz Results</h3>
```

With:
```tsx
<h3 className="font-bold text-2xl">Quiz Results</h3>
```

| Item | Detail |
|---|---|
| Files changed | 1 |
| Lines changed | 1 |
| Risk | Minimal |

