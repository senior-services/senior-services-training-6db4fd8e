

## Implement Hidden Employees Feature

### Summary

Add a "Hide Employee" feature to the Employees tab that mirrors the existing "Hide Training" functionality. This replaces the delete action with a hide action, preserves all employee data and assignments, and displays hidden employees in a collapsible accordion section.

---

### Changes Required

#### 1. Database Migration

**New File:** `supabase/migrations/[timestamp]_add_employee_archived_at.sql`

Add an `archived_at` column to the employees table:

```sql
ALTER TABLE employees ADD COLUMN archived_at TIMESTAMPTZ DEFAULT NULL;
CREATE INDEX idx_employees_archived_at ON employees(archived_at);
```

Update the `get_all_employee_assignments` function to filter out archived employees:

```sql
CREATE OR REPLACE FUNCTION public.get_all_employee_assignments()
RETURNS TABLE(...)
-- Add WHERE clause: WHERE e.archived_at IS NULL
```

Create a new function `get_hidden_employee_assignments` that returns only archived employees.

---

#### 2. API Service Changes

**File:** `src/services/api.ts`

Add methods to `employeeOperations` following the same pattern as `videoOperations`:

| Method | Description |
|--------|-------------|
| `archive(id)` | Sets `archived_at` timestamp |
| `unarchive(id)` | Clears `archived_at` to null |
| `getHidden()` | Fetches employees where `archived_at IS NOT NULL` |
| `hide(id)` | Semantic wrapper for `archive` |
| `show(id)` | Semantic wrapper for `unarchive` |

Update `getAll()` to only return non-archived employees (handled by updated database function).

---

#### 3. Employee Management Component

**File:** `src/components/dashboard/EmployeeManagement.tsx`

**Icon Change (Line 468)**:

| Before | After |
|--------|-------|
| `Trash2` icon | `EyeOff` icon |
| Delete confirmation dialog | Toast notification |

**Add State**:
```tsx
const [hiddenEmployees, setHiddenEmployees] = useState<EmployeeWithAssignments[]>([]);
```

**Add Load Function**:
```tsx
const loadHiddenEmployees = async () => {
  const result = await employeeOperations.getHidden();
  if (result.success && result.data) {
    setHiddenEmployees(result.data);
  }
};
```

**Add Handler Functions**:
```tsx
const handleHideEmployee = async (employee: EmployeeWithAssignments) => {
  const result = await employeeOperations.hide(employee.id);
  if (result.success) {
    toast({ title: "Success", description: `${employee.full_name || employee.email} has been hidden` });
    loadEmployees();
    loadHiddenEmployees();
  }
};

const handleShowEmployee = async (employee: EmployeeWithAssignments) => {
  const result = await employeeOperations.show(employee.id);
  if (result.success) {
    toast({ title: "Success", description: `${employee.full_name || employee.email} is now visible` });
    loadEmployees();
    loadHiddenEmployees();
  }
};
```

**Add Hidden Employees Accordion Section** (after main table, before modals):
- Same structure as VideoManagement hidden section (lines 251-303)
- Accordion with `EyeOff` icon and "Hidden Employees" title
- Badge showing count
- Info text: "Hidden employees remain functional with active assignments"
- Table with Name/Email column and Show action (Eye icon)

**Remove Delete Dialog**: The AlertDialog for delete confirmation (lines 483-499) can be removed since we're replacing delete with hide.

---

#### 4. Tooltip Updates

**File:** `src/utils/tooltipText.ts`

Add new cases:

```typescript
case 'hide-employee':
  return 'Hide employee from list';

case 'show-employee':
  return 'Show employee in main list';
```

---

#### 5. Data Export Update

**File:** `src/components/dashboard/EmployeeManagement.tsx`

The `exportToExcel` function (lines 293-402) only exports from the `employees` state, which will automatically exclude hidden employees after the database function update. No code change needed here.

---

### Files Modified

| File | Change |
|------|--------|
| `supabase/migrations/[timestamp]_add_employee_archived_at.sql` | New migration for column + updated functions |
| `src/services/api.ts` | Add archive/unarchive/hide/show/getHidden methods |
| `src/components/dashboard/EmployeeManagement.tsx` | Replace trash with eye icon, add hidden section |
| `src/utils/tooltipText.ts` | Add hide-employee and show-employee cases |

---

### Visual Changes

**Current Employee Row Actions:**
```
[Edit Assignments] [🗑️ Delete]
```

**New Employee Row Actions:**
```
[Edit Assignments] [👁️‍🗨️ Hide]
```

**New Hidden Employees Section** (appears when hidden employees exist):

```text
┌─────────────────────────────────────────────────────────────────────┐
│ ▼ 👁️‍🗨️ Hidden Employees  [2]  Hidden employees remain functional... │
├─────────────────────────────────────────────────────────────────────┤
│ Name                                    │ Actions                   │
├─────────────────────────────────────────┼───────────────────────────┤
│ John Smith                              │        [👁️ Show]          │
│ john@example.com                        │                           │
├─────────────────────────────────────────┼───────────────────────────┤
│ Jane Doe                                │        [👁️ Show]          │
│ jane@example.com                        │                           │
└─────────────────────────────────────────┴───────────────────────────┘
```

---

### Behavior Summary

1. **Hide Employee**: Clicking the eye icon sets `archived_at`, removes from main list, adds to hidden section
2. **Show Employee**: Clicking show in hidden section clears `archived_at`, moves back to main list
3. **Data Preservation**: All employee data, assignments, progress, and quiz attempts remain intact
4. **Active Assignments**: Hidden employees can still complete their assigned training

