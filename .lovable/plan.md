

## Add Download Data Dialog with Hidden Employees Option

### Summary

Update the "Download Data" button to open a dialog that lets users choose whether to include hidden employees in the Excel export. When including hidden employees, their quiz and video progress data will be loaded on-demand before generating the export.

---

### What You'll See

When you click "Download Data":
1. **If no hidden employees exist**: Export downloads immediately (no dialog needed)
2. **If hidden employees exist**: A dialog opens with:
   - Title: "Download Employee Data"
   - A toggle: "Include hidden employees" (off by default)  
   - A note showing how many hidden employees would be included
   - "Cancel" and "Download" buttons

---

### Changes Required

#### 1. Create New Component

**New File:** `src/components/dashboard/DownloadDataModal.tsx`

A dialog component following the existing `AddEmployeeModal` pattern with:
- A Switch toggle for "Include hidden employees"
- Count of hidden employees displayed
- Loading state during data export
- Proper accessibility (DialogTitle, description, labeled switch)

#### 2. Update EmployeeManagement Component

**File:** `src/components/dashboard/EmployeeManagement.tsx`

Changes:
- Add state for `showDownloadModal`
- Update "Download Data" button:
  - If no hidden employees → call `exportToExcel` directly (skip dialog)
  - If hidden employees exist → open the modal
- Modify `exportToExcel` to accept `includeHidden: boolean` parameter
- When `includeHidden` is true:
  1. Load quiz data for hidden employees on-demand (same logic as `loadEmployees` uses for visible employees)
  2. Merge visible + hidden employee data
  3. Deduplicate by employee ID (safety check)
  4. Process combined list for export
- Add loading indicator during hidden employee data fetch

---

### Technical Details

**Export Logic Flow:**

```text
User clicks "Download Data"
    ↓
Hidden employees exist?
    → No: Export immediately with visible employees only
    → Yes: Show dialog
              ↓
        User chooses toggle + clicks "Download"
              ↓
        Include hidden = true?
            → Load hidden employees' quiz/video data
            → Merge with visible employees
            → Deduplicate by ID
              ↓
        Generate and download Excel file
```

**Data Loading for Hidden Employees:**

The current `loadEmployees` function loads quiz data for visible employees. For hidden employees, we'll use the same pattern:
1. Fetch quizzes with video associations
2. For each hidden employee with email, call `quizOperations.getUserAttempts()`
3. Build the `employeeQuizzes` map entries for hidden employees

---

### Safety Measures

1. **Deduplication**: Merge by employee ID to prevent duplicates
2. **Loading State**: Show "Downloading..." text while processing
3. **Error Handling**: Toast message if hidden data fails to load
4. **Skip Dialog**: When no hidden employees exist, export immediately

---

### Accessibility

- Dialog has proper `DialogTitle`
- Switch has associated label via `htmlFor`
- Description text explains the toggle's purpose
- Focus trapped in dialog while open

