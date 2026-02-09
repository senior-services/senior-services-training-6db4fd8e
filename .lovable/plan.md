

## Update "Legacy - No Quiz" Label to "Exempt (No Quiz)"

### Changes

**File: `src/components/dashboard/AssignVideosModal.tsx`** (line 634)
- Change the displayed text from `Legacy - No Quiz` to `Exempt (No Quiz)`
- Update the `aria-label` to match: "Completed before quiz was added" can stay as-is (it's descriptive)

**File: `src/components/dashboard/EmployeeManagement.tsx`** (lines 492, 522)
- Line 492: Change the string assignment from `'Legacy - No Quiz'` to `'Exempt (No Quiz)'`
- Line 522: Update the condition check from `'Legacy - No Quiz'` to `'Exempt (No Quiz)'`

### Review
- **Top 5 Risks**: None -- simple string replacement with no logic changes.
- **Top 5 Fixes**: (1) Update label in 3 locations across 2 files.
- **Database Change Required**: No
- **Go/No-Go**: Go

