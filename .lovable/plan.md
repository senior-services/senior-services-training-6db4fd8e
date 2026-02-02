

## Change Default Filter to "Assigned" in Assign Videos Dialog

### Overview
Update the default filter mode in the Assign Videos dialog from "unassigned" to "assigned" so when the dialog opens, it shows assigned videos by default.

---

### Change Required

**File: `src/components/dashboard/AssignVideosModal.tsx`**  
**Line 101**

**Current:**
```tsx
const [filterMode, setFilterMode] = useState<'unassigned' | 'assigned' | 'completed' | 'all'>('unassigned');
```

**Updated:**
```tsx
const [filterMode, setFilterMode] = useState<'unassigned' | 'assigned' | 'completed' | 'all'>('assigned');
```

---

### Result
When the Assign Videos dialog opens, the "Assigned" toggle will be selected by default, showing the list of videos already assigned to the employee.

