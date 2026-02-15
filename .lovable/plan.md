

## Remove `bg-muted/50` from DialogScrollArea

### Overview
Remove the muted background color from the shared `DialogScrollArea` component, which is used by both standard and fullscreen dialogs.

### Change

**`src/components/ui/dialog.tsx` (line 102)**

Remove `bg-muted/50` from the className string:

```diff
- "flex-1 px-6 py-6 overflow-y-auto min-h-0 bg-muted/50",
+ "flex-1 px-6 py-6 overflow-y-auto min-h-0",
```

This is a single-line edit in one file. Both dialog variants share this component, so this one change covers both.

### Review
1. **Top 3 Risks**: (a) Dialogs with content that relied on the muted background for contrast may look slightly different -- purely cosmetic. (b) No functional impact. (c) No data flow changes.
2. **Top 3 Fixes**: (a) Scroll area now inherits parent background, giving a cleaner look. (b) Aligns with updated design direction.
3. **Database Change**: No.
4. **Verdict**: Go -- one-line edit.

