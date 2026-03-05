

## Fix: Assign/Unassign Buttons Using Wrong Size Variant

### Problem

The "Assign" and "Unassign" `ButtonWithTooltip` components in `AssignVideosModal.tsx` (lines 728 and 743) explicitly pass `size="sm"`, which applies `h-9`. Per the style guide, the default button height is `h-11`.

### Fix

Remove `size="sm"` from both buttons (lines 728 and 743) so they inherit the default size (`h-11`).

| Line | Before | After |
|------|--------|-------|
| 728 | `size="sm"` | *(removed)* |
| 743 | `size="sm"` | *(removed)* |

### Files Changed

| File | Change |
|------|--------|
| `src/components/dashboard/AssignVideosModal.tsx` | Remove `size="sm"` from Assign and Unassign `ButtonWithTooltip` components |

No CSS, database, or other file changes needed.

