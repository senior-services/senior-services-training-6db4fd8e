

## Fix Data Discrepancy Between Display and Download Export

### Overview
The exported Excel data shows different statuses than what's displayed on screen. This fix aligns both to use identical completion logic.

---

### What's Being Fixed

When you click "Download Data", videos show as "Pending" even when the screen shows them as "Complete". This happens because the download feature only checked for quiz completion, ignoring whether the employee actually watched the video.

**The fix ensures both the screen display and downloaded file use the same rules:**
- Videos without quizzes: Complete when watched to 100%
- Videos with quizzes: Complete when watched to 100% AND quiz is done

---

### Technical Change

**File: `src/components/dashboard/EmployeeManagement.tsx`**  
**Lines 305-326**

**Current (incorrect):**
```tsx
// Get status
let status = 'Pending';
if (quizAttempt) {
  status = 'Completed';
} else if (assignment.due_date) {
  // ... due date logic
} else {
  status = 'No Deadline';
}
```

**Updated (aligned with display logic):**
```tsx
// Get status - using same logic as getEmployeeStatus for consistency
let status = 'Pending';
const videoCompleted = assignment.progress_percent === 100 || assignment.completed_at;

// Check completion using same logic as display
let isCompleted = false;
if (assignment.hasQuiz) {
  // For videos with quiz: require both video and quiz completion
  isCompleted = videoCompleted && !!quizAttempt;
} else {
  // For videos without quiz: only require video completion
  isCompleted = videoCompleted;
}

if (isCompleted) {
  status = 'Completed';
} else if (assignment.due_date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(assignment.due_date);
  due.setHours(0, 0, 0, 0);
  const daysUntilDue = differenceInDays(due, today);
  if (isPast(due) && daysUntilDue < 0) {
    status = 'Overdue';
  } else if (daysUntilDue === 0) {
    status = 'Due Today';
  } else if (daysUntilDue <= 7) {
    status = 'Due';
  } else {
    status = 'Due';
  }
} else {
  status = 'No Deadline';
}
```

---

### Result
The downloaded Excel file will now show the same status as what appears on screen for each employee's training assignments.

