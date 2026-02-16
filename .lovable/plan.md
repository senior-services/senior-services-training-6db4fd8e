

## Centralized Date Formatting & Status Utility

### Overview

Create `src/utils/date-formatter.ts` with three format functions and a due-date status calculator, then refactor all components to use them. Database/state values remain raw ISO strings -- this utility is display-layer only.

### 1. New File: `src/utils/date-formatter.ts`

**Format functions** (all accept `string | Date`):

| Function | Pattern (date-fns) | Example Output |
|---|---|---|
| `formatShort(date)` | `MMM dd, ''yy` | `Feb 16, '26` |
| `formatMedium(date)` | `MMM dd, yyyy` | `Feb 16, 2026` |
| `formatLong(date)` | `MMMM dd, yyyy` | `February 16, 2026` |

Each function parses the input via `new Date(input)` and calls `format()` from date-fns.

**Status calculator** -- `getDueDateStatus(dueDate: string | Date)`:

Returns `{ text: string; status: 'overdue' | 'today' | 'near' | 'far' }`:

| Condition | `text` | `status` |
|---|---|---|
| Past due | `'Overdue'` | `'overdue'` |
| Due today | `'Due Today'` | `'today'` |
| 1-29 days away | `'Due in X days'` | `'near'` |
| 30+ days away | `'Due ' + formatShort(date)` | `'far'` |

**Badge variant mapper** -- `dueDateStatusToVariant(status)`:

Maps status to badge variant: `overdue` to `soft-destructive`, `today` to `soft-warning`, `near`/`far` to `soft-primary`.

### 2. Refactor: `src/components/TrainingCard.tsx`

- Replace the local `dueDateInfo` calculation (lines 147-215) with calls to `getDueDateStatus()` and `dueDateStatusToVariant()`
- Completed badge date (line 309): replace `format(..., 'MMM d')` with `formatShort()`
- Completed tooltip (line 316): replace `format(..., 'MMMM d, yyyy')` with `formatLong()`
- Due tooltip (line 350): replace `format(..., 'MMMM d, yyyy')` with `formatLong()`
- ARIA labels derived from the utility `text` field

### 3. Refactor: `src/utils/accessibility.ts`

- In `getStatusAnnouncement()` (lines 435-465): replace the local day-math with `getDueDateStatus()` and use its `text` for the announcement string
- In `getTrainingCardAriaLabel()` (line 410): use `formatLong()` instead of `toLocaleDateString()`

### 4. Refactor: `src/components/dashboard/AssignVideosModal.tsx`

- Line 392 (email due date string): already uses Long format -- keep as `formatLong()`
- Line 510 (completion date in table): replace `format(..., "MMM dd, yyyy")` with `formatShort()`
- Lines 525-531 (due date in table): replace `format(..., "MMM dd, yyyy")` with `formatShort()`

### 5. Refactor: `src/components/dashboard/VideoTable.tsx`

- Line 274 ("Date Added" column): replace `format(..., 'MMM dd, yyyy')` with `formatShort()`

### 6. Refactor: `src/components/dashboard/AdminManagement.tsx`

- Line 266: replace `format(..., 'MMM d, yyyy')` with `formatShort()`

### 7. Refactor: `src/components/dashboard/EmployeeManagement.tsx`

- Line 482 (due date): replace with `formatShort()`
- Line 489 (completion date): replace with `formatShort()`

### 8. Refactor: `src/components/dashboard/PeopleManagement.tsx`

- Line 409 (due date): replace with `formatShort()`
- Line 416 (completion date): replace with `formatShort()`

### 9. Refactor: `src/components/dashboard/VideoManagement.tsx`

- Line 416 (pending assignment due date): replace `format(..., 'MMMM d, yyyy')` with `formatLong()`

### 10. Edge Function: `supabase/functions/send-training-notification/index.ts`

- The `due_date` field is already formatted on the client side before being sent (line 392 in AssignVideosModal). The client will now use `formatLong()` for this, so no Edge Function changes are needed -- it simply renders the pre-formatted string.

### Files Summary

| File | Action |
|---|---|
| `src/utils/date-formatter.ts` | **Create** -- formatShort, formatMedium, formatLong, getDueDateStatus, dueDateStatusToVariant |
| `src/components/TrainingCard.tsx` | Edit -- replace local date math and format calls |
| `src/utils/accessibility.ts` | Edit -- use getDueDateStatus and formatLong |
| `src/components/dashboard/AssignVideosModal.tsx` | Edit -- use formatShort and formatLong |
| `src/components/dashboard/VideoTable.tsx` | Edit -- use formatShort |
| `src/components/dashboard/AdminManagement.tsx` | Edit -- use formatShort |
| `src/components/dashboard/EmployeeManagement.tsx` | Edit -- use formatShort |
| `src/components/dashboard/PeopleManagement.tsx` | Edit -- use formatShort |
| `src/components/dashboard/VideoManagement.tsx` | Edit -- use formatLong |

### Review

1. **Top 3 Risks:** (a) Short format uses two-digit year with apostrophe (`'26`) -- verify date-fns escape syntax. (b) TrainingCard refactor touches a complex memo -- must preserve existing variant/priority/aria logic. (c) Multiple files edited -- need to verify no stale `format` imports remain.
2. **Top 3 Fixes:** (a) Eliminates 7 inconsistent format strings across the codebase. (b) Single source of truth for due-date status thresholds. (c) Accessibility announcements stay in sync with visual badges.
3. **Database Change:** No.
4. **Verdict:** Go.

