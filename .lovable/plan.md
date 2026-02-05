

## Update Banner Component to Use Design System Color Tokens (with Fixes)

### Summary

Update the `Banner` component to use design system color tokens instead of hardcoded Tailwind colors, incorporating the reviewed fixes for better accessibility and consistency.

---

### Changes to Make

**File:** `src/components/ui/banner.tsx`

#### 1. Update Base Styles (Line 10)

Change icon color inheritance from `text-foreground` to `text-current`:

```tsx
// Before
"[&>svg]:text-foreground"

// After  
"[&>svg]:text-current"
```

This ensures icons automatically match the text color of each variant.

---

#### 2. Update All Variant Colors (Lines 12-20)

| Variant | Before (Hardcoded) | After (Design Tokens) |
|---------|--------------------|-----------------------|
| info | `bg-blue-50 text-blue-900 border-blue-200 dark:...` | `bg-primary/10 text-primary border-primary/20` |
| information | (same as info) | `bg-primary/10 text-primary border-primary/20` |
| success | `bg-green-50 text-green-900 border-green-200 dark:...` | `bg-success/10 text-success border-success/20` |
| warning | `bg-yellow-50 text-yellow-900 border-yellow-200 dark:...` | `bg-warning/10 text-warning border-warning/20` |
| error | `bg-red-50 text-red-900 border-red-200 dark:...` | `bg-destructive/10 text-destructive border-destructive/20` |
| destructive | `border-destructive/50 text-destructive dark:...` | `bg-destructive/10 text-destructive border-destructive/20` |
| **attention** | (new) | `bg-attention/10 text-attention border-attention/20` |

---

#### 3. Add Attention to Icon Map (Line 35)

```tsx
const iconMap = {
  info: Info,
  information: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: XCircle,
  destructive: XCircle,
  attention: AlertTriangle,  // New entry
  default: Info,
}
```

---

### Why These Fixes Matter

| Fix | Benefit |
|-----|---------|
| Use `--primary` for info | Better color contrast for readability, especially for seniors |
| Use `text-current` for icons | Icons automatically match their banner's color |
| Add attention variant | Full parity with Badge component |
| Remove dark mode overrides | Simpler code — design tokens handle dark mode automatically |

---

### Files Modified

| File | Change |
|------|--------|
| `src/components/ui/banner.tsx` | Update base styles, all variant colors, and add attention variant |

