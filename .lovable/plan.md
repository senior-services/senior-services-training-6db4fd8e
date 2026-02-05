

## Add Attention Banner & Refactor Hardcoded Colors

### Summary

This plan covers two updates:
1. Add the missing **attention banner** to the Components Gallery
2. Refactor **hardcoded Tailwind colors** across 7 files to use design system tokens

---

### Part 1: Add Attention Banner to Components Gallery

**File:** `src/pages/ComponentsGallery.tsx`

**Location:** After line 853 (after the Error Banner)

**Add:**
```tsx
{/* Attention Banner */}
<Banner variant="attention" title="Attention" description="Attention banner for items requiring user action." />
```

This completes the Banner section with all available variants matching the Badge component.

---

### Part 2: Refactor Hardcoded Colors

#### File 1: `src/pages/VideoPage.tsx`

| Line | Current (Hardcoded) | Replacement (Design Token) |
|------|---------------------|---------------------------|
| 258 | `bg-green-600 hover:bg-green-700` | `bg-success hover:bg-success/90` |
| 280 | `text-green-500` | `text-success` |
| 292 | `text-green-500` | `text-success` |
| 307 | `bg-green-100` | `bg-success/10` |
| 309 | `text-green-600` | `text-success` |

---

#### File 2: `src/pages/Auth.tsx`

| Line | Current (Hardcoded) | Replacement (Design Token) |
|------|---------------------|---------------------------|
| 147 | `bg-yellow-50 border-yellow-200` | `bg-attention/10 border-attention/20` |
| 149 | `text-yellow-800` | `text-attention` |
| 150 | `text-yellow-700` | `text-attention/80` |
| 154 | `border-blue-200 text-blue-700 hover:bg-blue-50` | `border-primary/30 text-primary hover:bg-primary/10` |
| 158 | `border-green-200 text-green-700 hover:bg-green-50` | `border-success/30 text-success hover:bg-success/10` |
| 162 | `border-red-200 text-red-700 hover:bg-red-50` | `border-destructive/30 text-destructive hover:bg-destructive/10` |
| 168 | `text-yellow-600` | `text-attention/80` |

---

#### File 3: `src/pages/AuthCallback.tsx`

| Line | Current (Hardcoded) | Replacement (Design Token) |
|------|---------------------|---------------------------|
| 225 | `text-yellow-500` | `text-attention` |

---

#### File 4: `src/pages/NotFound.tsx`

| Line | Current (Hardcoded) | Replacement (Design Token) |
|------|---------------------|---------------------------|
| 13 | `bg-gray-100` | `bg-muted` |
| 16 | `text-gray-600` | `text-muted-foreground` |
| 17 | `text-blue-500 hover:text-blue-700` | `text-primary hover:text-primary/80` |

---

#### File 5: `src/components/quiz/QuizScoreSummary.tsx`

| Line | Current (Hardcoded) | Replacement (Design Token) |
|------|---------------------|---------------------------|
| 16 | `text-emerald-600 bg-emerald-50 border-emerald-200` | `text-success bg-success/10 border-success/20` |
| 17 | `text-yellow-600 bg-yellow-50 border-yellow-200` | `text-attention bg-attention/10 border-attention/20` |
| 18 | `text-red-600 bg-red-50 border-red-200` | `text-destructive bg-destructive/10 border-destructive/20` |

---

#### File 6: `src/components/quiz/QuizModal.tsx`

Update the styling classes for quiz answer feedback:

| Pattern | Current | Replacement |
|---------|---------|-------------|
| Correct answer styling | `text-emerald-700 bg-emerald-50 border-emerald-200` | `text-success bg-success/10 border-success/20` |
| Incorrect answer styling | `text-red-700 bg-red-50 border-red-200` | `text-destructive bg-destructive/10 border-destructive/20` |
| Correct badge | `bg-emerald-100 text-emerald-800` | `bg-success/20 text-success` |
| Checkmark icons | `text-emerald-600` | `text-success` |
| X icons | `text-red-600` | `text-destructive` |
| True/False icons | `text-green-600` / `text-red-600` | `text-success` / `text-destructive` |

**Lines affected:** 248-252, 283-311, 355-399, 443-482

---

#### File 7: `src/components/ui/toast.tsx`

| Line | Current (Hardcoded) | Replacement (Design Token) |
|------|---------------------|---------------------------|
| 80 | `text-red-300` | `text-destructive/50` |
| 80 | `text-red-50` | `text-destructive-foreground` |
| 80 | `focus:ring-red-400` | `focus:ring-destructive/60` |
| 80 | `focus:ring-offset-red-600` | `focus:ring-offset-destructive` |

---

### Files Modified Summary

| File | Changes |
|------|---------|
| `src/pages/ComponentsGallery.tsx` | Add attention banner variant |
| `src/pages/VideoPage.tsx` | Update 5 green color references |
| `src/pages/Auth.tsx` | Update 7 color references in dev testing section |
| `src/pages/AuthCallback.tsx` | Update 1 yellow color reference |
| `src/pages/NotFound.tsx` | Update 3 color references |
| `src/components/quiz/QuizScoreSummary.tsx` | Update 3 score color patterns |
| `src/components/quiz/QuizModal.tsx` | Update ~20 color references for answer feedback |
| `src/components/ui/toast.tsx` | Update 4 destructive state colors |

---

### Benefits

| Benefit | Description |
|---------|-------------|
| Consistency | All colors now reference the same design tokens |
| Maintainability | Changing a color in `index.css` updates it everywhere |
| Dark mode support | Tokens automatically adjust for light/dark themes |
| Accessibility | Ensures contrast ratios are managed centrally |

