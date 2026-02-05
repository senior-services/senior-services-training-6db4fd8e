

## Header Style Adjustments

### Summary

1. Change "/ Admin Dashboard" portion to normal font weight (currently the entire title is `font-bold`)
2. Reduce vertical padding from `py-4` to `py-2` to achieve ~60px header height

---

### Changes Required

**File:** `src/components/Header.tsx`

#### 1. Update Title Font Weight (Line 30)

Split the title text so "Learning Hub" remains bold but "/ Admin Dashboard" has normal weight:

| Before | After |
|--------|-------|
| `<h1 className="text-xl font-bold text-primary-foreground">Learning Hub / Admin Dashboard</h1>` | `<h1 className="text-xl text-primary-foreground"><span className="font-bold">Learning Hub</span> <span className="font-normal">/ Admin Dashboard</span></h1>` |

#### 2. Reduce Vertical Padding (Line 21)

| Before | After |
|--------|-------|
| `py-4` | `py-2` |

This changes vertical padding from 16px (top + bottom = 32px) to 8px (top + bottom = 16px), resulting in approximately 60px total height with the logo (h-12 = 48px) plus padding.

---

### Files Modified

| File | Change |
|------|--------|
| `src/components/Header.tsx` | Reduce padding to `py-2`, split title into bold/normal weight spans |

---

### Visual Result

- **Title**: "Learning Hub" will be bold, "/ Admin Dashboard" will be normal weight
- **Height**: Header will be approximately 60px tall (48px logo + 8px top + 8px bottom padding)

