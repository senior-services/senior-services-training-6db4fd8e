

## Remove Checkbox from Completed Course Rows

### Overview
Currently, the checkbox for completed courses is disabled but still visible. The user wants to completely hide/remove the checkbox from rows where the course is already completed.

---

### Change Required

**File: `src/components/dashboard/AssignVideosModal.tsx`**

**Lines 656-665** - Conditionally render the checkbox only for non-completed courses:

**Current:**
```tsx
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
```

**Updated:**
```tsx
<TableCell className="w-[40px]">
  {!isCompleted && (
    <Checkbox
      id={`video-${video.id}`}
      checked={isSelected}
      onCheckedChange={(checked) => 
        handleVideoToggle(video.id, checked as boolean)
      }
    />
  )}
</TableCell>
```

---

### Technical Details
- Wraps the `<Checkbox>` in a conditional render `{!isCompleted && (...)}`
- Removes the `disabled={isCompleted}` prop since it's no longer needed
- The `<TableCell>` remains to maintain table structure and consistent column widths
- Completed rows will show an empty cell where the checkbox would be

