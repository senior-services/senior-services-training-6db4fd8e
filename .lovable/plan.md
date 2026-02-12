

## Fix SortableTableHead Font Size: Use `button-compact`

### Problem
The `SortableTableHead` inner Button receives `button-base` (16px font-size) which overrides `text-small` (13px), causing sortable headers to render larger than standard `TableHead` elements.

### Change (1 file)

**`src/components/ui/sortable-table-head.tsx`** -- line 63

| Before | After |
|--------|-------|
| `"text-small uppercase text-muted-foreground p-0 h-auto"` | `"button-compact uppercase text-muted-foreground"` |

`button-compact` handles `min-height: auto`, `padding: 0`, and `font-size: inherit` in one class, replacing the three ad-hoc resets (`text-small`, `p-0`, `h-auto`) and eliminating the `button-base` conflict.

### Review

1. **Top 3 Risks:** (1) None -- `button-compact` already existed and does exactly what the three replaced utilities did. (2) No visual change beyond the intended 16px-to-13px correction. (3) Zero impact on non-sortable headers.
2. **Top 3 Fixes:** (1) All sortable headers app-wide inherit 13px from `TableHead`. (2) Single semantic class replaces three ad-hoc utilities. (3) Consistent header sizing across dashboard tables.
3. **Database Change:** No
4. **Verdict:** Go -- one-line fix.

