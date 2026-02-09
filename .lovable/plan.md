

## Update Section Count Badges to Soft Variant

### What's Changing
The count badges next to "Required Courses" and "Completed Courses" section headings will switch from solid variants to soft variants for a lighter, more consistent look.

- **Required Courses badge** (currently `variant="default"`, solid blue): Changes to `variant="soft-primary"` (light blue background with subtle border)
- **Completed Courses badge** (currently `variant="success"`, solid green): Changes to `variant="soft-success"` (light green background with subtle border)

### Technical Details

**File: `src/pages/EmployeeDashboard.tsx`** -- 2 single-line changes:
- Line 566: Change `variant="default"` to `variant="soft-primary"`
- Line 621: Change `variant="success"` to `variant="soft-success"`

### Review
- **Top 5 Risks**: None -- variant-only styling change on existing Badge components.
- **Top 5 Fixes**: (1) Switch Required badge to soft-primary. (2) Switch Completed badge to soft-success.
- **Database Change Required**: No
- **Go/No-Go**: Go

