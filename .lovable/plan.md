

## Checkbox Redesign for Assign Videos Dialog

### Overview
Redesign the checkbox behavior to use an **additive/subtractive workflow** where checkboxes start unchecked and enable context-aware Assign or Unassign buttons based on the type of videos selected.

---

### New Behavior

| Filter View | Starting State | When Checked | Action Available |
|-------------|----------------|--------------|------------------|
| Unassigned | All unchecked | "Assign Videos" button appears | Creates new assignments |
| Assigned (Pending/Overdue) | All unchecked | "Unassign" button appears | Shows confirmation, then removes assignments |
| Completed | Visible, disabled | Cannot check | No action (read-only) |
| All | Mixed per video type | Context-aware buttons | Based on selection type |

---

### File to Modify

**`src/components/dashboard/AssignVideosModal.tsx`**

---

### Change 1: Add Unassign Dialog State

**Line 102** - Add new state variable after `showDiscardDialog`:

```tsx
const [showUnassignDialog, setShowUnassignDialog] = useState(false);
```

---

### Change 2: Initialize Checkboxes as Unchecked

**Line 162** - Change from copying assigned IDs to empty set:

```tsx
// Before
setSelectedVideoIds(new Set(currentlyAssigned));

// After  
setSelectedVideoIds(new Set());
```

---

### Change 3: Add Selection Helper Functions

**Before line 246 (before the old handleSubmit)** - Add these helper functions:

```tsx
// Get IDs of selected unassigned videos (for assigning)
const getSelectedUnassignedIds = (): Set<string> => {
  const result = new Set<string>();
  for (const videoId of selectedVideoIds) {
    if (!assignedVideoIds.has(videoId) && !completedVideoIds.has(videoId)) {
      result.add(videoId);
    }
  }
  return result;
};

// Get IDs of selected assigned videos that can be unassigned (pending/overdue, not completed)
const getSelectedAssignedIds = (): Set<string> => {
  const result = new Set<string>();
  for (const videoId of selectedVideoIds) {
    if (assignedVideoIds.has(videoId) && !completedVideoIds.has(videoId)) {
      result.add(videoId);
    }
  }
  return result;
};
```

---

### Change 4: Replace handleSubmit with Separate Handlers

**Lines 246-326** - Replace the entire `handleSubmit` function with two safe handlers:

```tsx
// Handle assigning new videos (additive only - cannot delete existing)
const handleAssign = async () => {
  if (!employee) return;

  const videosToAssign = getSelectedUnassignedIds();
  if (videosToAssign.size === 0) return;

  setIsSubmitting(true);
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const promises: Promise<any>[] = [];
    for (const videoId of videosToAssign) {
      const dueDate = videoDeadlines.get(videoId);
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
    setIsSubmitting(false);
  }
};

// Handle unassigning videos (called after confirmation)
const handleUnassign = async () => {
  if (!employee) return;

  const videosToUnassign = getSelectedAssignedIds();
  if (videosToUnassign.size === 0) return;

  setIsSubmitting(true);
  try {
    const promises: Promise<any>[] = [];
    for (const videoId of videosToUnassign) {
      const assignment = assignmentData.get(videoId);
      if (assignment) {
        promises.push(assignmentOperations.delete(assignment.id));
      }
    }

    await Promise.all(promises);

    toast({
      title: "Success",
      description: `${videosToUnassign.size} training${videosToUnassign.size !== 1 ? 's' : ''} unassigned from ${employee.full_name || employee.email}`,
    });

    onAssignmentComplete();
    onOpenChange(false);
  } catch (error) {
    logger.error('Error unassigning videos', error as Error);
    toast({
      title: "Error",
      description: "Failed to unassign trainings",
      variant: "destructive",
    });
  } finally {
    setIsSubmitting(false);
    setShowUnassignDialog(false);
  }
};
```

---

### Change 5: Simplify handleClose and closeModal

**Lines 328-347** - Update change detection and reset logic:

```tsx
const handleClose = () => {
  // Only show discard dialog if user has made selections
  if (selectedVideoIds.size > 0) {
    setShowDiscardDialog(true);
  } else {
    closeModal();
  }
};

const closeModal = () => {
  setSelectedVideoIds(new Set());
  setVideoDeadlines(new Map(initialVideoDeadlines));
  setCalendarOpen(new Map());
  setShowDiscardDialog(false);
  setShowUnassignDialog(false);
  setFilterMode('unassigned');
  onOpenChange(false);
};
```

---

### Change 6: Update Derived State Variables

**Lines 425-432** - Replace old change detection with new selection counts:

```tsx
const selectedUnassignedCount = getSelectedUnassignedIds().size;
const selectedAssignedCount = getSelectedAssignedIds().size;
const canAssign = selectedUnassignedCount > 0;
const canUnassign = selectedAssignedCount > 0;
const filteredVideos = getFilteredVideos();
const filteredVideosCount = filteredVideos.length;
```

---

### Change 7: Replace Footer with Context-Aware Buttons

**Lines 603-618** - Replace DialogFooter content:

```tsx
<DialogFooter>
  <Button
    type="button"
    variant="outline"
    onClick={handleClose}
    disabled={isSubmitting}
  >
    Cancel
  </Button>
  
  {canUnassign && (
    <Button 
      variant="destructive"
      onClick={() => setShowUnassignDialog(true)}
      disabled={isSubmitting}
    >
      Unassign ({selectedAssignedCount})
    </Button>
  )}
  
  {canAssign && (
    <Button 
      onClick={handleAssign} 
      disabled={isSubmitting}
    >
      {isSubmitting ? 'Assigning...' : `Assign Videos (${selectedUnassignedCount})`}
    </Button>
  )}
</DialogFooter>
```

---

### Change 8: Add Unassign Confirmation Dialog

**After line 634 (after the existing discard dialog)** - Add new confirmation dialog:

```tsx
<AlertDialog open={showUnassignDialog} onOpenChange={setShowUnassignDialog}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Unassign trainings?</AlertDialogTitle>
      <AlertDialogDescription>
        Are you sure you want to unassign {selectedAssignedCount} training{selectedAssignedCount !== 1 ? 's' : ''}? 
        Any user progress will be lost and cannot be retrieved.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
      <AlertDialogAction 
        onClick={handleUnassign}
        disabled={isSubmitting}
        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
      >
        {isSubmitting ? 'Unassigning...' : 'Unassign'}
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

---

### Button Visibility Logic

| User Selection | Cancel | Unassign | Assign Videos |
|----------------|--------|----------|---------------|
| None | Shown | Hidden | Hidden |
| Only unassigned videos | Shown | Hidden | Shown with count |
| Only assigned videos | Shown | Shown with count | Hidden |
| Both types | Shown | Shown with count | Shown with count |

---

### Safety Guarantees

1. **No accidental deletions**: The `handleAssign` function only creates new assignments - it never touches existing ones
2. **Explicit unassign flow**: Removing assignments requires explicit checkbox selection + confirmation dialog
3. **Completed videos protected**: Checkbox is disabled for completed trainings
4. **Clear user warning**: Unassign confirmation explicitly warns about progress loss

