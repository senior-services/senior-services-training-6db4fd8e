

# Simplify Course Count Badges

## What changes

The badges next to "Required Courses" and "Completed Courses" headings currently show text like "4 To-do" and "3 Completed". They will be simplified to show just the number: "4" and "3".

## How

**File: `src/pages/EmployeeDashboard.tsx`**

- **Line 553**: Change `{trainingData.required.length} To-do` to `{trainingData.required.length}`
- **Line 608**: Change `{trainingData.completed.length} Completed` to `{trainingData.completed.length}`

| Item | Detail |
|---|---|
| Files changed | 1 |
| Lines changed | 2 |
| Risk | Minimal -- text-only change |

