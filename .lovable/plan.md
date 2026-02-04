

## Align Download Data Labels with Edit Assignments Dialog

### What's Being Fixed

Two inconsistencies between the Excel download and the Edit Assignments dialog:
1. **Completed courses**: Due Date column should still show the original due date (not blank)
2. **Pending without due date**: Should show "N/A" (matching AssignVideosModal) instead of "--"

---

### Changes

**File: `src/components/dashboard/EmployeeManagement.tsx`**

**Lines 347-351** - Update Due Date logic to always show due date (even for completed) and use "N/A" for pending without due date:

```tsx
// Current:
let dueDate = '--';
if (assignment.due_date) {
  dueDate = format(new Date(assignment.due_date), 'MMM dd, yyyy');
}

// Updated:
let dueDate = 'N/A';  // Changed from '--' to match AssignVideosModal
if (assignment.due_date) {
  dueDate = format(new Date(assignment.due_date), 'MMM dd, yyyy');
}
// Due date is always shown regardless of completion status (no changes needed here,
// the current logic already preserves due date for completed items)
```

---

### Label Consistency Summary

| Element | AssignVideosModal | Download Data (After Fix) |
|---------|-------------------|---------------------------|
| Status values | pending, overdue, completed, unassigned | Pending, Overdue, Completed, Unassigned |
| Due Date (no deadline) | "N/A" | "N/A" ✓ |
| Due Date (has deadline) | "Due Jan 15, 2026" | "Jan 15, 2026" |
| Due Date (completed) | "Jan 12, 2026" (completion date) | "Jan 15, 2026" (original due date) |
| No assignments | "--" | "--" (for unassigned row) |

Note: The dialog shows "Due " prefix and completion date in the Date column because it's a combined display. The Excel export has separate "Due Date" and "Completion Date" columns, so no prefix is needed.

---

### Result

- Completed courses will continue to show their original due date in the "Due Date" column
- Pending courses without an assigned deadline will show "N/A" instead of "--"
- Unassigned employee rows will continue to show "--" for both date columns

