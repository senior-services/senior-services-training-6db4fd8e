

## Fix: Dialog Should Open with "Assigned" View (Not "Unassigned")

### What's Happening

When you close the "Edit Assignments" dialog and reopen it, it shows the "Unassigned" view instead of the expected "Assigned" view.

### Why This Happens

There's a mismatch in the code:
- When the dialog first loads, it correctly starts with the "Assigned" view
- But when you close the dialog, the reset code accidentally switches it to "Unassigned"
- The next time you open it, you see "Unassigned" instead of "Assigned"

Think of it like a door that's supposed to reset to "locked" when closed, but it's accidentally resetting to "unlocked" instead.

---

### The Fix

**File: `src/components/dashboard/AssignVideosModal.tsx`**  
**Line 452**

Change this line in the `closeModal` function:
```tsx
setFilterMode('unassigned');
```

To:
```tsx
setFilterMode('assigned');
```

This ensures the filter resets to "Assigned" (the correct default) every time the dialog closes.

---

### Result

| Scenario | Before Fix | After Fix |
|----------|------------|-----------|
| Open dialog for first time | Assigned ✓ | Assigned ✓ |
| Close and reopen dialog | Unassigned ✗ | Assigned ✓ |

The dialog will now consistently open with the "Assigned" view, showing employees their current training assignments first.

