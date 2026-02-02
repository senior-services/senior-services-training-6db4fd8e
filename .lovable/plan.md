

## Implement Fullscreen Dialog for Edit Assignments Modal

### Overview
Converting the "Edit Assignments" dialog in Admin → Employees to use the new `FullscreenDialogContent` component. This provides more screen space for viewing and managing video assignments.

---

### File to Modify

**`src/components/dashboard/AssignVideosModal.tsx`**

---

### Change 1: Update Import (Lines 2-9)

**Current:**
```tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogScrollArea,
  DialogFooter,
} from '@/components/ui/dialog';
```

**New:**
```tsx
import {
  Dialog,
  FullscreenDialogContent,
  DialogHeader,
  DialogTitle,
  DialogScrollArea,
  DialogFooter,
} from '@/components/ui/dialog';
```

---

### Change 2: Replace Opening Tag (Line 385)

**Current:**
```tsx
<DialogContent className="sm:max-w-2xl">
```

**New:**
```tsx
<FullscreenDialogContent>
```

---

### Change 3: Replace Closing Tag (Line 590)

**Current:**
```tsx
</DialogContent>
```

**New:**
```tsx
</FullscreenDialogContent>
```

---

### What Changes for Users

| Aspect | Before | After |
|--------|--------|-------|
| Dialog size | Fixed max-width of 672px | Fills screen with 8-10px margins |
| Video list | Compact, may require scrolling | More room to see all assignments |
| Date pickers | Can feel cramped | More breathing room |
| Mobile experience | Standard centered modal | Near-fullscreen for easier touch |

---

### What Stays the Same

- All video assignment functionality
- Checkbox selection behavior
- Date picker calendars
- Filter toggles (Unassigned/Assigned)
- "Discard changes?" confirmation dialog (remains standard AlertDialog)
- Save and Cancel buttons

