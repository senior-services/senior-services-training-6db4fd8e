

## Add "Due Tomorrow" Phrasing to Date Utility

### Overview

A single-file edit to `src/utils/date-formatter.ts` that adds a "Due Tomorrow" case and maps it to the `soft-warning` badge variant. Accessibility stays in sync automatically since `src/utils/accessibility.ts` already reads the `text` field from `getDueDateStatus`.

### Changes

**File: `src/utils/date-formatter.ts`**

1. Add `'tomorrow'` to the `DueDateStatusKey` union type.
2. Insert a new branch in `getDueDateStatus` between the "today" and "near" checks:
   - `daysUntil === 1` returns `{ text: 'Due Tomorrow', status: 'tomorrow' }`.
   - The existing "near" branch condition narrows to `daysUntil >= 2 && daysUntil < 30`.
3. In `dueDateStatusToVariant`, add `case 'tomorrow'` alongside `case 'today'` to return `'soft-warning'`.

**No other files need editing.** `TrainingCard.tsx` and `accessibility.ts` already consume the utility's `text` and `status` fields dynamically -- the new `'tomorrow'` status maps through `dueDateStatusToVariant` to `soft-warning`, and the `'Due Tomorrow'` text flows into badges and screen-reader announcements automatically.

### Technical Detail

```text
getDueDateStatus logic (updated):

  daysUntil < 0   -->  { text: 'Overdue',           status: 'overdue'  }
  daysUntil === 0  -->  { text: 'Due Today',          status: 'today'    }
  daysUntil === 1  -->  { text: 'Due Tomorrow',       status: 'tomorrow' }  <-- NEW
  2..29            -->  { text: 'Due in X days',      status: 'near'     }
  30+              -->  { text: 'Due <short date>',   status: 'far'      }

dueDateStatusToVariant:

  overdue   --> soft-destructive
  today     --> soft-warning
  tomorrow  --> soft-warning   <-- NEW
  near/far  --> soft-primary
```

### Review

1. **Top 3 Risks:** (a) TypeScript consumers that exhaustively switch on `DueDateStatusKey` will need the new case -- but `dueDateStatusToVariant` is the only switch and it gets updated here. (b) None other; single-file change.
2. **Top 3 Fixes:** (a) Eliminates the grammatically incorrect "Due in 1 days". (b) Amber badge for tomorrow conveys appropriate urgency. (c) Zero additional files to touch.
3. **Database Change:** No.
4. **Verdict:** Go.

