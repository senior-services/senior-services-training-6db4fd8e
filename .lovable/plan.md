

## Fix: Change "Pending" Badge to Soft Variant

### What's Being Fixed

In the Edit Assignments dialog, the "Pending" status badge uses a solid secondary style while all other status badges use soft variants. This creates visual inconsistency.

---

### The Fix

**File: `src/components/dashboard/AssignVideosModal.tsx`**  
**Line 492**

Change the pending case from solid to soft variant:

```tsx
case "pending":
  return "soft-secondary";  // Was: "secondary"
```

---

### Current vs. After Fix

| Status | Current Variant | After Fix |
|--------|----------------|-----------|
| Completed | soft-success ✓ | soft-success |
| Overdue | soft-destructive ✓ | soft-destructive |
| **Pending** | **secondary** (solid) | **soft-secondary** |
| Unassigned | soft-tertiary ✓ | soft-tertiary |

All status badges will now consistently use soft variants for a unified look.

