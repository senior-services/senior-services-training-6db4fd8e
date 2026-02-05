
# Plan: Add "Assign to All Employees" Feature

## What We're Building

When admins add a new course, they'll have an optional checkbox to automatically assign it to all active employees at once. When checked, a due date picker will appear so they can set when the training is due. Before the assignment happens, a confirmation step will show exactly how many employees will receive the assignment.

---

## User Experience Flow

1. Admin opens "Add New Course" dialog
2. Fills in course title, description, and video URL (existing flow)
3. Sees new checkbox: "Assign to all employees"
4. When checked, due date options slide into view:
   - 1 week (default)
   - 2 weeks
   - 1 month
   - No due date required
5. Clicks "Add Course"
6. **Confirmation dialog appears**: "Assign to 47 employees?"
   - Shows employee count and selected due date
   - "Cancel" or "Add & Assign" buttons
7. Course is created and assigned in one action
8. Success message: "Course Title" added and assigned to 47 employees

---

## Key Improvements from Review

| Concern | Solution |
|---------|----------|
| Performance with many employees | Use single batch database insert instead of individual calls |
| Accidental bulk assignments | Add confirmation dialog showing employee count |
| Code duplication | Create shared DueDateSelector component used by both dialogs |
| Consistency | Both "Add Course" and "Edit Assignments" use same due date options |

---

## Files to Create

### 1. Shared Due Date Selector Component

**New file: `src/components/shared/DueDateSelector.tsx`**

A reusable component that displays the due date radio options. Used by both the Add Course dialog and the Edit Assignments dialog to ensure consistency.

Options provided:
- 1 week from today
- 2 weeks from today  
- 1 month from today
- No due date required

Includes the `calculateDueDate()` helper function to compute actual dates.

---

## Files to Modify

### 2. Add Content Modal Updates

**File: `src/components/content/AddContentModal.tsx`**

Changes:
- Add "Assign to all employees" checkbox with proper accessibility labels
- Show/hide due date picker based on checkbox state (progressive disclosure)
- Update form data interface to include assignment options
- Pass assignment data to parent on save

New state variables:
- `assignToAll` (boolean) - tracks checkbox
- `dueDateOption` and `noDueDateRequired` - tracks due date selection

### 3. Video Management Handler Updates

**File: `src/components/dashboard/VideoManagement.tsx`**

Changes:
- Show confirmation dialog when "assign to all" is selected
- Display employee count and due date in confirmation
- After course creation, perform batch assignment using single database insert
- Show appropriate success message with count

New flow:
1. If `assignToAll` is true, fetch active employee count first
2. Show confirmation dialog with count
3. On confirm: create course, then batch-insert all assignments
4. Show combined success toast

### 4. API Service Enhancement

**File: `src/services/api.ts`**

Add new batch assignment method to `assignmentOperations`:

```text
createBatch(assignments: {
  video_id: string;
  employee_id: string;
  assigned_by: string;
  due_date?: string;
}[]): Promise<ApiResult<VideoAssignment[]>>
```

This uses a single `supabase.from('video_assignments').insert(assignments)` call instead of multiple individual inserts - much faster and avoids partial failures.

### 5. Edit Assignments Modal Refactor

**File: `src/components/dashboard/AssignVideosModal.tsx`**

Changes:
- Replace inline RadioGroup (lines 875-906) with the new shared `DueDateSelector` component
- Extract `calculateDueDate` helper to shared component
- Ensures both dialogs stay in sync if options change

---

## Technical Details

### Updated Form Data Interface

```text
ContentFormData {
  title: string
  description: string
  content_type: 'video' | 'presentation'
  url: string
  assignToAll?: boolean      // NEW
  dueDate?: Date             // NEW (calculated from selection)
}
```

### Batch Insert Approach

Instead of:
```text
for each employee:
  await assignmentOperations.create(...)  // 47 API calls = slow
```

We use:
```text
const assignments = employees.map(emp => ({...}))
await supabase.from('video_assignments').insert(assignments)  // 1 API call = fast
```

### Accessibility Considerations

- Checkbox has proper `id` and `aria-describedby` linking to helper text
- Due date section uses `aria-live="polite"` for screen reader announcements
- Confirmation dialog is properly labeled with `AlertDialog` component
- Focus management when revealing due date picker

---

## Edge Cases Handled

| Scenario | Behavior |
|----------|----------|
| No active employees | Skip assignment step, show "Course added" only |
| Assignment partial failure | Log error, still report course created successfully |
| User unchecks after selecting date | Reset due date selection, hide picker |
| Dialog closed before saving | Reset all assignment-related state |
| Very large employee count | Batch insert handles efficiently; confirmation prevents accidents |

---

## Summary of Changes

| File | Change Type | Purpose |
|------|-------------|---------|
| `src/components/shared/DueDateSelector.tsx` | Create | Shared due date picker component |
| `src/components/content/AddContentModal.tsx` | Modify | Add checkbox and progressive disclosure |
| `src/components/dashboard/VideoManagement.tsx` | Modify | Add confirmation dialog and batch assignment logic |
| `src/services/api.ts` | Modify | Add `createBatch` method for efficient bulk inserts |
| `src/components/dashboard/AssignVideosModal.tsx` | Modify | Use shared DueDateSelector component |

**No database changes required** - existing `video_assignments` table supports this feature.
