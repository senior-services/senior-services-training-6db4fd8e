

## Add Table View with Status Columns to Assign Videos Dialog

### Overview
Transform the current list-based video display into a structured table with three columns: **Course**, **Completion Status**, and **Due Date**. Uses soft badge variants for better visibility against table backgrounds.

---

### File to Modify

**`src/components/dashboard/AssignVideosModal.tsx`**

---

### Change 1: Add Table and Badge Imports

**Add to existing imports:**
```tsx
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
```

---

### Change 2: Add Helper Functions (Before getFilteredVideos function)

```tsx
// Get completion status for a video
const getCompletionStatus = (videoId: string): 'overdue' | 'pending' | 'completed' | 'unassigned' => {
  if (completedVideoIds.has(videoId)) return 'completed';
  if (!assignedVideoIds.has(videoId)) return 'unassigned';
  
  const deadline = videoDeadlines.get(videoId) || assignmentData.get(videoId)?.due_date;
  if (deadline) {
    const dueDate = typeof deadline === 'string' ? new Date(deadline) : deadline;
    if (isPast(dueDate) && !completedVideoIds.has(videoId)) {
      return 'overdue';
    }
  }
  return 'pending';
};

// Format due date for display
const formatDueDate = (videoId: string): string => {
  if (!assignedVideoIds.has(videoId) && !selectedVideoIds.has(videoId)) return '--';
  
  if (completedVideoIds.has(videoId)) {
    const progressData = videoProgressData.get(videoId);
    if (progressData?.completed_at) {
      return format(new Date(progressData.completed_at), 'MMM dd, yyyy');
    }
  }
  
  const deadline = videoDeadlines.get(videoId);
  const existingDueDate = assignmentData.get(videoId)?.due_date;
  
  if (deadline) {
    return format(deadline, 'MMM dd, yyyy');
  } else if (existingDueDate) {
    return format(new Date(existingDueDate), 'MMM dd, yyyy');
  }
  return 'N/A';
};

// Get badge variant for completion status (using soft variants for visibility)
const getStatusBadgeVariant = (status: 'overdue' | 'pending' | 'completed' | 'unassigned') => {
  switch (status) {
    case 'completed': return 'soft-success';
    case 'overdue': return 'soft-destructive';
    case 'pending': return 'secondary';
    case 'unassigned': return 'soft-tertiary';
  }
};
```

---

### Change 3: Replace Video List with Table

**Replace the current video list section with:**

```tsx
<div className="overflow-x-auto">
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead className="w-[40px]"></TableHead>
        <TableHead>Course</TableHead>
        <TableHead>Completion Status</TableHead>
        <TableHead>Due Date</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {filteredVideos.map((video) => {
        const isSelected = selectedVideoIds.has(video.id);
        const isCompleted = completedVideoIds.has(video.id);
        const status = getCompletionStatus(video.id);
        
        return (
          <TableRow key={video.id}>
            <TableCell className="w-[40px]">
              <Checkbox
                id={`video-${video.id}`}
                checked={isSelected}
                disabled={isCompleted}
                onCheckedChange={(checked) => 
                  handleVideoToggle(video.id, checked as boolean)
                }
              />
            </TableCell>
            
            <TableCell>
              <Label 
                htmlFor={`video-${video.id}`}
                className={cn(
                  "flex items-center gap-2",
                  !isCompleted && "cursor-pointer"
                )}
              >
                <span className={cn(
                  "font-medium text-sm",
                  isCompleted && "text-muted-foreground"
                )}>
                  {video.title}
                </span>
                {hiddenVideoIds.has(video.id) && (
                  <Tooltip delayDuration={TOOLTIP_CONFIG.delayDuration}>
                    <TooltipTrigger asChild>
                      <span className="text-warning">
                        <EyeOff className="h-4 w-4" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p>This video is hidden from view on videos tab</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </Label>
            </TableCell>
            
            <TableCell>
              <Badge variant={getStatusBadgeVariant(status)}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Badge>
            </TableCell>
            
            <TableCell>
              {isSelected && !isCompleted ? (
                <Popover 
                  open={calendarOpen.get(video.id) || false}
                  onOpenChange={(open) => {
                    setCalendarOpen(prev => {
                      const newOpen = new Map(prev);
                      newOpen.set(video.id, open);
                      return newOpen;
                    });
                  }}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "h-8 justify-start text-left font-normal px-2",
                        !videoDeadlines.get(video.id) && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-3 w-3" />
                      {formatDueDate(video.id)}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-[9999]" align="start">
                    <Calendar
                      mode="single"
                      selected={videoDeadlines.get(video.id)}
                      onSelect={(date) => handleDeadlineChange(video.id, date)}
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              ) : (
                <span className="text-sm text-muted-foreground">
                  {formatDueDate(video.id)}
                </span>
              )}
            </TableCell>
          </TableRow>
        );
      })}
    </TableBody>
  </Table>
</div>
```

---

### Badge Variant Mapping (Soft for Visibility)

| Status | Badge Variant | Visual |
|--------|---------------|--------|
| Completed | soft-success | Green with light background tint |
| Overdue | soft-destructive | Red with light background tint |
| Pending | secondary | Gray solid |
| Unassigned | soft-tertiary | Neutral with light background |

---

### Status Logic Summary

| State | Completion Status | Due Date |
|-------|------------------|----------|
| Not assigned | Unassigned | -- |
| Assigned, no due date | Pending | N/A |
| Assigned, due date set | Pending | MMM dd, yyyy |
| Assigned, past due date | Overdue | MMM dd, yyyy |
| Completed | Completed | MMM dd, yyyy (completion date) |

---

### Key Details

- **Date format**: `MMM dd, yyyy` (e.g., "Feb 15, 2026") — matches app-wide format
- **Soft badges**: Better visibility with subtle background tints vs ghost variants
- **Mobile responsive**: Table wrapped in `overflow-x-auto` for horizontal scrolling
- **Existing functionality preserved**: Checkbox, calendar picker, hidden video indicator

