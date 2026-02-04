

## Update Download Data Excel Export Format

### What's Being Changed

The Excel export in the "Download Data" feature needs to be updated to:
1. Rename "Training" column header to "Course"
2. Add a new "Completion Date" column after "Due Date" (only show date if completed)
3. Rename "Completion Status" to "Status"
4. Align status values with AssignVideosModal: `Pending`, `Overdue`, `Unassigned`, `Completed`

---

### Changes

**File: `src/components/dashboard/EmployeeManagement.tsx`**

**Lines 291-298** - Update columns for employees with no assignments:

```tsx
// Current:
exportData.push({
  Name: employeeName,
  Email: employeeEmail,
  'Video Title': 'No assignments',
  Status: 'No Required Training',
  'Date': '--',
  'Quiz Results': '--'
});

// Updated:
exportData.push({
  Name: employeeName,
  Email: employeeEmail,
  'Course': 'No assignments',
  'Status': 'Unassigned',
  'Due Date': '--',
  'Completion Date': '--',
  'Quiz Results': '--'
});
```

**Lines 305-338** - Simplify status logic to match AssignVideosModal:

```tsx
// Current logic has many statuses: 'Pending', 'Completed', 'Overdue', 'Due Today', 'Due', 'No Deadline'

// Updated logic (4 statuses only):
let status = 'Pending';
const videoCompleted = assignment.progress_percent === 100 || assignment.completed_at;

let isCompleted = false;
if (assignment.hasQuiz) {
  isCompleted = videoCompleted && !!quizAttempt;
} else {
  isCompleted = videoCompleted;
}

if (isCompleted) {
  status = 'Completed';
} else if (assignment.due_date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(assignment.due_date);
  due.setHours(0, 0, 0, 0);
  if (isPast(due)) {
    status = 'Overdue';
  } else {
    status = 'Pending';
  }
} else {
  status = 'Pending';  // No due date = still pending
}
```

**Lines 351-372** - Separate Due Date and Completion Date columns:

```tsx
// Current: Single 'Date' column that shows due date OR completion date

// Updated: Two separate columns
let dueDate = '--';
let completionDate = '--';

// Due Date - always show the original due date if it exists
if (assignment.due_date) {
  dueDate = format(new Date(assignment.due_date), 'MMM dd, yyyy');
}

// Completion Date - only show if completed
if (isCompleted) {
  if (quizAttempt && quizAttempt.completed_at) {
    completionDate = format(new Date(quizAttempt.completed_at), 'MMM dd, yyyy');
  } else if (assignment.completed_at) {
    completionDate = format(new Date(assignment.completed_at), 'MMM dd, yyyy');
  }
}

exportData.push({
  Name: employeeName,
  Email: employeeEmail,
  'Course': assignment.video_title || '',
  'Status': status,
  'Due Date': dueDate,
  'Completion Date': completionDate,
  'Quiz Results': quizResults
});
```

---

### Result

| Column Change | Before | After |
|--------------|--------|-------|
| Header | "Training" | "Course" |
| Header | "Completion Status" | "Status" |
| New Column | N/A | "Completion Date" (after Due Date) |
| Status Values | Pending, Completed, Overdue, Due Today, Due, No Deadline | Pending, Completed, Overdue, Unassigned |

**Example Excel Output:**

| Name | Email | Course | Status | Due Date | Completion Date | Quiz Results |
|------|-------|--------|--------|----------|-----------------|--------------|
| John Smith | john@example.com | Safety Training | Completed | Jan 15, 2026 | Jan 12, 2026 | 85% (17/20 Correct) |
| John Smith | john@example.com | Customer Service | Overdue | Jan 10, 2026 | -- | Not Completed |
| Jane Doe | jane@example.com | No assignments | Unassigned | -- | -- | -- |

