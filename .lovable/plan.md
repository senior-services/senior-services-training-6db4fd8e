

## Admin Dashboard Table Text Size Update

### Problem
Three data elements in the Trainings table use `text-small` (0.8rem / 13px), which is too small for comfortable reading. They need to be bumped to `text-body` (1rem / 16px).

### Changes (1 file: `src/components/dashboard/VideoTable.tsx`)

| # | Element | Line | Before | After |
|---|---------|------|--------|-------|
| 1 | Training description | 244 | `text-small text-muted-foreground` | `text-body text-muted-foreground` |
| 2 | Quiz question count | 258 | `text-small text-foreground` | `text-body text-foreground` |
| 3 | Date added | 273 | `text-small text-foreground` | `text-body text-foreground` |

All three are `<span>` or `<p>` tags inside `<TableCell>` elements -- legitimate data-display text, not metadata labels. Bumping to `text-body` aligns them with the training title's base font size for consistent readability.

### Review

1. **Top 3 Risks:** (1) Slightly taller table rows due to larger text -- acceptable trade-off for legibility. (2) Description `line-clamp-2` still works at `text-body`. (3) No impact on the hidden-videos accordion table (separate markup in `VideoManagement.tsx`).
2. **Top 3 Fixes:** (1) Description, quiz count, and date are now consistently sized at 16px. (2) Zero layout-breaking risk. (3) Single-file change.
3. **Database Change:** No
4. **Verdict:** Go -- 3 class swaps in one file.

