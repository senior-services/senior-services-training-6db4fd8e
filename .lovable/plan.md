
## Implement Simplified Due Date Dialog with All Fixes

### Overview
Update the Assign Videos modal to:
1. Move action buttons (Assign, Unassign) to the header next to filter toggles
2. Remove the footer with action buttons
3. Replace per-row date pickers with a centralized due date selection dialog
4. Include all critical fixes identified in the review

---

### File to Modify

**`src/components/dashboard/AssignVideosModal.tsx`**

---

### Change 1: Update Imports (Line 8)

Remove unused `DialogFooter` import and add imports that may be needed:

**Before:**
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

**After:**
```tsx
import {
  Dialog,
  FullscreenDialogContent,
  DialogHeader,
  DialogTitle,
  DialogScrollArea,
} from '@/components/ui/dialog';
```

---

### Change 2: Add New State Variables (After Line 106)

Add state for the due date selection dialog:

```tsx
const [showDueDateDialog, setShowDueDateDialog] = useState(false);
const [dueDateOption, setDueDateOption] = useState<'1week' | '2weeks' | '1month' | null>('1week');
const [noDueDateRequired, setNoDueDateRequired] = useState(false);
```

---

### Change 3: Remove Unused State (Line 99)

Delete the `calendarOpen` state which is no longer needed:

```tsx
// DELETE THIS LINE:
const [calendarOpen, setCalendarOpen] = useState<Map<string, boolean>>(new Map());
```

---

### Change 4: Add Due Date Helper Functions (After Line 245)

Add functions to calculate due dates and handle user interactions:

```tsx
// Calculate due date based on selected option
const calculateDueDate = (): Date | undefined => {
  if (noDueDateRequired) return undefined;
  
  const today = new Date();
  switch (dueDateOption) {
    case '1week': {
      const date = new Date(today);
      date.setDate(date.getDate() + 7);
      return date;
    }
    case '2weeks': {
      const date = new Date(today);
      date.setDate(date.getDate() + 14);
      return date;
    }
    case '1month': {
      const date = new Date(today);
      date.setMonth(date.getMonth() + 1);
      return date;
    }
    default:
      return undefined;
  }
};

// Handle toggle selection - uncheck "no due date" when selecting a preset
const handleDueDateOptionChange = (value: string) => {
  if (value) {
    setDueDateOption(value as '1week' | '2weeks' | '1month');
    setNoDueDateRequired(false);
  }
};

// Handle checkbox - deselect toggles when checking "no due date"
const handleNoDueDateChange = (checked: boolean | 'indeterminate') => {
  const isChecked = checked === true;
  setNoDueDateRequired(isChecked);
  if (isChecked) {
    setDueDateOption(null);
  } else {
    setDueDateOption('1week');
  }
};

// Reset dialog state when closing
const resetDueDateDialog = () => {
  setDueDateOption('1week');
  setNoDueDateRequired(false);
  setShowDueDateDialog(false);
};
```

---

### Change 5: Update handleAssign Function (Lines 270-306)

Modify to use the centralized due date from the dialog:

```tsx
const handleAssign = async () => {
  if (!employee) return;

  const videosToAssign = getSelectedUnassignedIds();
  if (videosToAssign.size === 0) return;

  const dueDate = calculateDueDate();

  setIsSubmitting(true);
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const promises: Promise<any>[] = [];
    for (const videoId of videosToAssign) {
      promises.push(assignmentOperations.create(videoId, employee.id, user.id, dueDate));
    }

    await Promise.all(promises);

    toast({
      title: "Success",
      description: `${videosToAssign.size} training${videosToAssign.size !== 1 ? 's' : ''} assigned to ${employee.full_name || employee.email}`,
    });

    onAssignmentComplete();
    onOpenChange(false);
  } catch (error) {
    logger.error('Error assigning videos', error as Error);
    toast({
      title: "Error",
      description: "Failed to assign trainings",
      variant: "destructive",
    });
  } finally {
    setIsSubmitting(false);  // CRITICAL FIX: was incorrectly set to true in original plan
    resetDueDateDialog();
  }
};
```

---

### Change 6: Update closeModal Function (Lines 356-364)

Remove the `calendarOpen` reset since we're removing that state:

```tsx
const closeModal = () => {
  setSelectedVideoIds(new Set());
  setVideoDeadlines(new Map(initialVideoDeadlines));
  setShowDiscardDialog(false);
  setShowUnassignDialog(false);
  setFilterMode('unassigned');
  resetDueDateDialog();
  onOpenChange(false);
};
```

---

### Change 7: Move Action Buttons to Header (Lines 468-489)

Update the filter section to include action buttons on the right:

```tsx
<div className="pb-3 border-b flex items-center justify-between gap-4 flex-wrap">
  <ToggleGroup 
    type="single" 
    value={filterMode} 
    onValueChange={(value) => setFilterMode(value as typeof filterMode || 'unassigned')}
    variant="pill"
    className="justify-start flex-wrap"
  >
    <ToggleGroupItem value="unassigned" className="text-xs px-3 py-1" aria-label="Filter by unassigned videos">
      Unassigned
    </ToggleGroupItem>
    <ToggleGroupItem value="assigned" className="text-xs px-3 py-1" aria-label="Filter by assigned videos">
      Assigned
    </ToggleGroupItem>
    <ToggleGroupItem value="completed" className="text-xs px-3 py-1" aria-label="Filter by completed videos">
      Completed
    </ToggleGroupItem>
    <ToggleGroupItem value="all" className="text-xs px-3 py-1" aria-label="Show all videos">
      All
    </ToggleGroupItem>
  </ToggleGroup>

  {/* Action buttons moved to header */}
  <div className="flex items-center gap-2">
    {canAssign && (
      <Button 
        onClick={() => setShowDueDateDialog(true)} 
        disabled={isSubmitting}
        size="sm"
      >
        Assign ({selectedUnassignedCount})
      </Button>
    )}
    {canUnassign && (
      <Button 
        variant="outline"
        onClick={() => setShowUnassignDialog(true)}
        disabled={isSubmitting}
        size="sm"
      >
        Unassign ({selectedAssignedCount})
      </Button>
    )}
  </div>
</div>
```

---

### Change 8: Simplify Due Date Column (Lines 566-606)

Replace the per-row date picker popover with a simple read-only display:

```tsx
<TableCell>
  <span className="text-sm text-muted-foreground">
    {formatDueDate(video.id)}
  </span>
</TableCell>
```

---

### Change 9: Remove DialogFooter (Lines 618-646)

Delete the entire DialogFooter section since buttons are now in the header.

---

### Change 10: Add Due Date Selection Dialog (After Line 684)

Add the new simplified dialog before the closing `</Dialog>` tag:

```tsx
{/* Due Date Selection Dialog */}
<AlertDialog open={showDueDateDialog} onOpenChange={(open) => !open && resetDueDateDialog()}>
  <AlertDialogContent className="sm:max-w-md">
    <AlertDialogHeader>
      <AlertDialogTitle>Select due date to assign trainings</AlertDialogTitle>
      <AlertDialogDescription>
        {selectedUnassignedCount} training{selectedUnassignedCount !== 1 ? 's' : ''} selected
      </AlertDialogDescription>
    </AlertDialogHeader>
    
    <div className={cn("space-y-6 py-4", isSubmitting && "opacity-50 pointer-events-none")}>
      {/* Date preset toggles */}
      <div className="flex items-center gap-4 flex-wrap">
        <span className="text-sm font-medium text-foreground">Training due in</span>
        <ToggleGroup 
          type="single" 
          value={noDueDateRequired ? '' : (dueDateOption || '')}
          onValueChange={handleDueDateOptionChange}
          disabled={isSubmitting}
          className="gap-2"
        >
          <ToggleGroupItem 
            value="1week" 
            className="border rounded-md px-4 py-2 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
            aria-label="Due in 1 week"
          >
            1 week
          </ToggleGroupItem>
          <ToggleGroupItem 
            value="2weeks" 
            className="border rounded-md px-4 py-2 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
            aria-label="Due in 2 weeks"
          >
            2 weeks
          </ToggleGroupItem>
          <ToggleGroupItem 
            value="1month" 
            className="border rounded-md px-4 py-2 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
            aria-label="Due in 1 month"
          >
            1 month
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
      
      {/* No due date checkbox with enhanced accessibility */}
      <div className="flex items-start space-x-2">
        <Checkbox 
          id="no-due-date" 
          checked={noDueDateRequired}
          onCheckedChange={handleNoDueDateChange}
          disabled={isSubmitting}
          aria-describedby="no-due-date-desc"
        />
        <div className="grid gap-1.5 leading-none">
          <Label 
            htmlFor="no-due-date" 
            className="text-sm font-normal cursor-pointer"
          >
            No due date required
          </Label>
          <p id="no-due-date-desc" className="text-xs text-muted-foreground">
            Training will be assigned without a deadline
          </p>
        </div>
      </div>
    </div>

    <AlertDialogFooter>
      <AlertDialogCancel disabled={isSubmitting} onClick={resetDueDateDialog}>
        Cancel
      </AlertDialogCancel>
      <AlertDialogAction 
        onClick={handleAssign}
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Assigning...' : 'Assign'}
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

---

### Change 11: Clean Up Unused Imports (Lines 34-39)

Remove Calendar and Popover imports if no longer used elsewhere in the file:

```tsx
// DELETE IF NO LONGER USED:
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
```

Also remove `CalendarIcon` from the lucide-react import (line 45) if no longer used.

---

### Summary of All Fixes Applied

| Fix | Location | Description |
|-----|----------|-------------|
| Critical typo | handleAssign finally block | Changed `setIsSubmitting(true)` to `setIsSubmitting(false)` |
| Loading state | Due date dialog content | Added `opacity-50 pointer-events-none` class during submission |
| Disabled controls | ToggleGroup & Checkbox | Added `disabled={isSubmitting}` props |
| Accessibility | Checkbox | Added `aria-describedby` and helper text description |
| State cleanup | closeModal function | Added `resetDueDateDialog()` call |
| Unused code | calendarOpen state | Removed along with related handlers |
| Unused imports | Calendar, Popover, CalendarIcon | Removed if no longer needed |

---

### Visual Result

**Header with action buttons:**
```
+------------------------------------------------------------------+
| Assign Videos to John Doe                                        |
+------------------------------------------------------------------+
| [Unassigned][Assigned][Completed][All]    [Assign(3)][Unassign] |
+------------------------------------------------------------------+
| □ Course Name          | Status    | Due Date                    |
+------------------------------------------------------------------+
```

**Due date selection dialog:**
```
+--------------------------------------------------+
| Select due date to assign trainings              |
| 3 trainings selected                             |
|                                                  |
| Training due in   [1 week] [2 weeks] [1 month]  |
|                                                  |
| ☐ No due date required                           |
|   Training will be assigned without a deadline   |
|                                                  |
|                         [Cancel]  [Assign]       |
+--------------------------------------------------+
```
