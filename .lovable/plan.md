

## Root Cause: Parent Component Unmounts the Dialog

The flicker persists because the fix was applied in the wrong place. Here's what's actually happening:

1. After you assign/unassign, the modal calls `onAssignmentComplete()`
2. That function (`loadEmployees` in the parent) sets `loading = true`
3. When loading is true, the **parent component completely disappears** and shows skeleton loaders
4. This removes the entire dialog from the screen
5. When loading finishes, everything reappears

Think of it like this: we put curtains on the window to prevent light flickering, but someone is turning the whole room on and off instead.

---

## The Fix

We need to update the parent component (`EmployeeManagement.tsx`) to support a "silent refresh" that keeps everything visible.

---

### File 1: `src/components/dashboard/EmployeeManagement.tsx`

**Change 1: Update loadEmployees to accept optional silent mode (Lines 90-92)**

```tsx
// Before
const loadEmployees = useCallback(async () => {
  try {
    setLoading(true);

// After
const loadEmployees = useCallback(async (silentRefresh = false) => {
  try {
    if (!silentRefresh) {
      setLoading(true);
    }
```

**Change 2: Only reset loading if it was set (Line 163-164)**

```tsx
// Before
} finally {
  setLoading(false);
}

// After
} finally {
  if (!silentRefresh) {
    setLoading(false);
  }
}
```

This requires making `silentRefresh` accessible in the finally block by defining it outside the try.

---

### File 2: `src/components/dashboard/AssignVideosModal.tsx`

**Change: Update the callback type and pass true when calling (Lines 54 and 342, 382)**

```tsx
// Line 54 - Update prop type
onAssignmentComplete: (silentRefresh?: boolean) => void;

// Line 342 - After assign
onAssignmentComplete(true);

// Line 382 - After unassign  
onAssignmentComplete(true);
```

---

## Summary

| Component | What Changes |
|-----------|--------------|
| EmployeeManagement | `loadEmployees` accepts optional `silentRefresh` parameter; skips setting/clearing `loading` state when true |
| AssignVideosModal | Calls `onAssignmentComplete(true)` to request silent refresh |

---

## Expected Behavior

| When | What Happens |
|------|--------------|
| Page first loads | Full skeleton loaders (normal) |
| Assign/unassign from dialog | Dialog stays visible, parent refreshes data silently, dialog shows its own spinner overlay |

The dialog will now stay on screen throughout the entire process.

