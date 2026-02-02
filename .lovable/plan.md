

## Implement Dialog Persistence Fix

### Overview
This fix prevents the dialog content from flickering/disappearing when refreshing data after assign/unassign actions. Instead of replacing all content with skeleton loaders, we'll show a subtle overlay with a spinner while keeping the existing content visible.

---

### File to Modify

**`src/components/dashboard/AssignVideosModal.tsx`**

---

### Change 1: Update Import (Line 46)

Add `LoadingSpinner` to the existing import:

```tsx
// Before
import { LoadingSkeleton } from '@/components/ui/loading-spinner';

// After
import { LoadingSkeleton, LoadingSpinner } from '@/components/ui/loading-spinner';
```

---

### Change 2: Add isRefreshing State (Line 92-93)

Add a new state variable between `loading` and `isSubmitting`:

```tsx
// Before
const [loading, setLoading] = useState(false);
const [isSubmitting, setIsSubmitting] = useState(false);

// After
const [loading, setLoading] = useState(false);
const [isRefreshing, setIsRefreshing] = useState(false);
const [isSubmitting, setIsSubmitting] = useState(false);
```

---

### Change 3: Update loadVideosAndAssignments Function Signature (Lines 112-115)

Accept an optional `isRefresh` parameter and use different loading states:

```tsx
// Before
const loadVideosAndAssignments = async () => {
  if (!employee) return;

  setLoading(true);

// After
const loadVideosAndAssignments = async (isRefresh = false) => {
  if (!employee) return;

  if (isRefresh) {
    setIsRefreshing(true);
  } else {
    setLoading(true);
  }
```

---

### Change 4: Update Finally Block (Lines 191-194)

Reset both loading states:

```tsx
// Before
} finally {
  setLoading(false);
}

// After
} finally {
  setLoading(false);
  setIsRefreshing(false);
}
```

---

### Change 5: Pass isRefresh=true After Actions (Lines 337 and 376)

Update the refresh calls after successful assign/unassign:

```tsx
// Line 337 - in handleAssign
// Before
await loadVideosAndAssignments();

// After
await loadVideosAndAssignments(true);

// Line 376 - in handleUnassign
// Before
await loadVideosAndAssignments();

// After
await loadVideosAndAssignments(true);
```

---

### Change 6: Add Refresh Overlay to DialogScrollArea (Line 504)

Add `className="relative"` to DialogScrollArea and add the overlay inside:

```tsx
// Before
<DialogScrollArea>
  {loading ? (
    ...
  ) : (
    <>
      ...

// After
<DialogScrollArea className="relative">
  {isRefreshing && (
    <div 
      className="absolute inset-0 bg-background/50 flex items-center justify-center z-10"
      role="status"
      aria-live="polite"
    >
      <LoadingSpinner size="lg" label="Updating assignments" />
    </div>
  )}
  {loading ? (
    ...
  ) : (
    <>
      ...
```

---

### Summary of Changes

| Line(s) | What Changes |
|---------|--------------|
| 46 | Add `LoadingSpinner` to import |
| 92-93 | Add `isRefreshing` state |
| 112-115 | Add `isRefresh` parameter, conditional loading state |
| 191-194 | Reset both `loading` and `isRefreshing` in finally block |
| 337 | Pass `true` to `loadVideosAndAssignments` in handleAssign |
| 376 | Pass `true` to `loadVideosAndAssignments` in handleUnassign |
| 504 | Add `className="relative"` and refresh overlay with ARIA attributes |

---

### User Experience After Implementation

1. **Initial open** → Shows skeleton loaders (unchanged behavior)
2. **After assign/unassign** → Content stays visible with semi-transparent overlay and spinner
3. **Refresh complete** → Overlay disappears, data updates in place
4. **Accessibility** → Screen readers announce "Updating assignments" during refresh

