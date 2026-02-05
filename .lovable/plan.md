

## Change Table Header Background to 50% Opacity

### Summary

Update the table header background color from full muted (`bg-muted`) to 50% opacity (`bg-muted/50`) for a subtler, less visually heavy appearance.

---

### Changes Required

#### 1. Update Table Component

**File:** `src/components/ui/table.tsx` (line 30)

| Before | After |
|--------|-------|
| `bg-muted` | `bg-muted/50` |

This is the `TableHeader` component that sets the background for all table headers.

---

### Component Gallery

No additional changes needed in `src/pages/ComponentsGallery.tsx`. The gallery imports and uses the `Table` components directly, so it will automatically reflect the updated styling from the base component.

---

### Visual Change

**Before:** Table headers have a solid muted gray background

**After:** Table headers have a softer, 50% transparent muted background

---

### Consistency Note

This aligns the `TableHeader` styling with `TableFooter`, which already uses `bg-muted/50` (line 53 in table.tsx).

