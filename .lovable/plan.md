

## Quiz Results Badge & Styling Updates

### Changes in `src/components/quiz/QuizModal.tsx` (3 question type sections)

**1. User's incorrect selection** — 3 locations (lines 352-355, 432-435, 504-507):
- Change `showIcon` to false and manually add an `X` icon from lucide-react
- Change label from "Incorrect" to "Your Answer"
```tsx
<Badge variant="destructive">
  <X className="w-3 h-3 mr-1" />
  Your Answer
</Badge>
```

**2. Missed correct answer badge** — 3 locations (lines 357-360, 437-440, 509-512):
- Change variant from `soft-success` to `hollow-success`
- Change label from "Correct" to "Correct Answer"
```tsx
<Badge variant="hollow-success" showIcon>
  Correct Answer
</Badge>
```

**3. Missed correct answer row styling** — Add `else if (!isSelected && isCorrect)` branch in all 3 `optionClassName` blocks (after the destructive branch, ~lines 314, 410, 489):
```typescript
} else if (!isSelected && isCorrect) {
  optionClassName += " text-success bg-success/10 border-success/20 rounded-md p-3 border";
}
```

### Import
Add `X` to the lucide-react import in QuizModal.tsx.

### Files Changed

| File | Change |
|------|--------|
| `src/components/quiz/QuizModal.tsx` | Badge updates (icon, label, variant) + row styling for missed correct answers |

No database, CSS, or Badge component changes needed. The `hollow-success` variant and `showIcon` for success (Check icon) already exist.

