

## Expand Course Column to Fill Remaining Width

### Summary

Make the "Course" column expand to fill all remaining available table width, while other columns only take the space they need.

---

### Changes Required

**File:** `src/components/dashboard/VideoTable.tsx`

#### 1. Update Course Column Header (Line 147-155)

Add `w-full` class to the SortableTableHead to make it expand:

| Before | After |
|--------|-------|
| `className="whitespace-nowrap"` | `className="whitespace-nowrap w-full"` |

#### 2. Update Course Column Cell (Line 198)

Change from `w-auto max-w-0` to `w-full` to ensure the cell also expands:

| Before | After |
|--------|-------|
| `className="py-2 w-auto max-w-0"` | `className="py-2 w-full"` |

---

### Files Modified

| File | Change |
|------|--------|
| `src/components/dashboard/VideoTable.tsx` | Add `w-full` to Course column header and cells |

---

### Visual Result

The Course column will expand to fill all remaining table width, while Quiz, Date Added, and Actions columns will only take the minimum space they need for their content.

