

## Conditionally Include Visibility Column in Export

### Summary

When the user does not select "Include hidden employees", omit the Visibility column entirely from the Excel export since all employees would be "Active" anyway. Only show the Visibility column when hidden employees are included.

---

### Changes

**File:** `src/components/dashboard/EmployeeManagement.tsx`

1. **Update `processEmployeesForExport` function signature** (line 388)
   - Change `hiddenEmployeeIds: Set<string>` to `includeVisibility: boolean` and `hiddenEmployeeIds: Set<string>`
   - Or simpler: pass `includeHidden: boolean` to determine if Visibility column is needed

2. **Conditionally add Visibility column** (lines 398-407 and 463-472)
   - Only add the `'Visibility'` property when `includeHidden` is true
   - Use spread operator to conditionally include the field

3. **Update the function call in `exportToExcel`** (line 501)
   - Pass `includeHidden` boolean to the function

---

### Code Changes

**Update function signature (lines 384-389):**
```tsx
const processEmployeesForExport = useCallback((
  employeesToExport: EmployeeWithAssignments[],
  videosMap: Map<string, any[]>,
  quizzesMap: Map<string, Map<string, any>>,
  hiddenEmployeeIds: Set<string>,
  includeVisibility: boolean
): any[] => {
```

**Conditionally add Visibility to "no assignments" case (lines 398-407):**
```tsx
exportData.push({
  Name: employeeName,
  Email: employeeEmail,
  'Course': 'No assignments',
  'Status': STATUS_LABELS.unassigned,
  'Due Date': '--',
  'Completion Date': '--',
  'Quiz Results': '--',
  ...(includeVisibility && { 'Visibility': hiddenEmployeeIds.has(employee.id) ? 'Hidden' : 'Active' })
});
```

**Conditionally add Visibility to assignments case (lines 463-472):**
```tsx
exportData.push({
  Name: employeeName,
  Email: employeeEmail,
  'Course': assignment.video_title || '',
  'Status': status,
  'Due Date': dueDate,
  'Completion Date': completionDate,
  'Quiz Results': quizResults,
  ...(includeVisibility && { 'Visibility': hiddenEmployeeIds.has(employee.id) ? 'Hidden' : 'Active' })
});
```

**Update call in `exportToExcel` (line 501):**
```tsx
const hiddenEmployeeIds = new Set(hiddenEmployees.map(e => e.id));
const exportData = processEmployeesForExport(allEmployees, allVideos, allQuizzes, hiddenEmployeeIds, includeHidden);
```

---

### Result

| Scenario | Columns in Export |
|----------|-------------------|
| Hidden employees **not** included | Name, Email, Course, Status, Due Date, Completion Date, Quiz Results |
| Hidden employees **included** | Name, Email, Course, Status, Due Date, Completion Date, Quiz Results, **Visibility** |

