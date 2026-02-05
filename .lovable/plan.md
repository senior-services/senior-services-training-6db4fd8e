

## Update Header Background and Table Header Styling

### Summary

1. Update the site Header component to use the new `--background-header` token
2. Remove the `--muted` entry from the UI Colors section in Components Gallery
3. Add `bg-muted` background to table headers (both the base component and Components Gallery examples)

---

### Changes Required

#### 1. Update Header Component

**File:** `src/components/Header.tsx` - Line 21

| Before | After |
|--------|-------|
| `bg-background` | `bg-background-header` |

Since `--background-header` is a dark navy color (`207 55% 25%`), text colors will also need to be updated for contrast:

| Element | Current Class | New Class |
|---------|--------------|-----------|
| "Learning Hub" title | `text-primary` | `text-primary-foreground` |
| Admin subtitle | `text-[hsl(var(--admin-highlight))]` | Keep as-is (yellow/orange highlights work on dark) |
| Employee subtitle | `text-muted-foreground` | `text-primary-foreground/70` |
| User name | `text-foreground` | `text-primary-foreground` |
| User icon container | `bg-primary` | `bg-primary-foreground` |
| User icon | `text-primary-foreground` | `text-primary` |
| Chevron | `text-muted-foreground` | `text-primary-foreground/70` |

---

#### 2. Remove --muted from UI Colors

**File:** `src/pages/ComponentsGallery.tsx` - Lines 386-392

Delete the `--muted` color swatch entry entirely.

---

#### 3. Add bg-muted to TableHeader Component

**File:** `src/components/ui/table.tsx` - Line 23

| Before | After |
|--------|-------|
| `[&_tr]:border-b` | `bg-muted [&_tr]:border-b` |

---

#### 4. Update Components Gallery Tables

**File:** `src/pages/ComponentsGallery.tsx`

Add `className="bg-muted"` to all TableHeader components:

| Line | Change |
|------|--------|
| 1033 | Add `className="bg-muted"` to TableHeader |
| 1083 | Add `className="bg-muted"` to TableHeader |
| 1166 | Add `className="bg-muted"` to TableHeader |
| 1247 | Add `className="bg-muted"` to TableHeader |
| 1329 | Add `className="bg-muted"` to TableHeader |

---

### Files Modified

| File | Change |
|------|--------|
| `src/components/Header.tsx` | Use `bg-background-header` and update text colors for contrast |
| `src/components/ui/table.tsx` | Add `bg-muted` to TableHeader base component |
| `src/pages/ComponentsGallery.tsx` | Remove `--muted` swatch, add `bg-muted` to all TableHeader examples |

---

### Visual Result

- **Header**: Dark navy background matching the new `--background-header` token with white text
- **Tables**: All table headers will have a subtle muted background for better visual hierarchy
- **UI Colors Section**: Cleaner list without the redundant `--muted` entry (still exists in the design system, just not shown in UI Colors)

