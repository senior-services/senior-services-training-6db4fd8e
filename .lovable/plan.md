
## Change To-do Badge Variant to Soft-Primary

### Summary

Update the "To-do" status badge in the Edit Assignments modal to use the `soft-primary` variant instead of `soft-secondary` for better visual distinction.

---

### Change Required

**File:** `src/components/dashboard/AssignVideosModal.tsx`

Update line 504:

| Before | After |
|--------|-------|
| `return "soft-secondary";` | `return "soft-primary";` |

---

### Visual Change

**Before:** To-do badge appears in muted gray/secondary color

**After:** To-do badge appears in blue/primary color for better visibility

---

### Context

The `getStatusBadgeVariant` function (lines 497-510) maps each status to a badge variant:
- Completed → `soft-success` (green)
- Overdue → `soft-destructive` (red)
- **Pending (To-do)** → `soft-secondary` → **`soft-primary`** (blue)
- Unassigned → `soft-tertiary` (gray)

This change makes the "To-do" status more visually prominent and distinguishable from "Unassigned" items.
