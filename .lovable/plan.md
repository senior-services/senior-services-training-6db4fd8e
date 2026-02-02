

## Change Status Badge from "Completed/Total Complete" to "Pending" Count

### Overview
Update the partial completion status badge in the Employees tab to show the number of pending (incomplete) required training items instead of showing completed/total.

---

### Change Required

**File: `src/components/dashboard/EmployeeManagement.tsx`**  
**Line 280**

**Current:**
```tsx
return <Badge variant="secondary">{completedRequired.length}/{requiredVideos.length} Complete</Badge>;
```

**Updated:**
```tsx
const pendingCount = requiredVideos.length - completedRequired.length;
return <Badge variant="secondary">{pendingCount} Pending</Badge>;
```

---

### Result
- Before: "2/5 Complete"
- After: "3 Pending"

The badge will now show how many required training items are still pending instead of showing progress as a fraction.

