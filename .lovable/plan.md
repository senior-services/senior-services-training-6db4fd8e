

## Fix: AlertDialogTitle Typography Scale (text-h3 to text-h4)

### Problem
The `AlertDialogTitle` primitive renders its `h2` element with `text-h3` (25px), which is oversized for dialog context. It should use `text-h4` (20px) to match the `DialogTitle` standard established for senior-first dialog typography.

### Fix

**File: `src/components/ui/alert-dialog.tsx` (line 94)**

Change the base class from `text-h3` to `text-h4`:

```tsx
// Before
className={cn("text-h3", className)}

// After
className={cn("text-h4", className)}
```

This single change propagates to every `AlertDialogTitle` instance across the app, including:
- Components Gallery ("Important Information", "Are you sure?")
- Cancel confirmation dialogs in `VideoPlayerFullscreen.tsx`
- Any other alert dialogs using the primitive

No other files need editing -- the primitive is the single source of truth.

### Review

1. **Top 3 Risks:** (a) None -- this aligns alert dialogs with the already-established `DialogTitle` standard. (b) All existing alert dialogs benefit automatically. (c) No downstream overrides detected.
2. **Top 3 Fixes:** (a) Alert dialog titles match the 20px dialog typography standard. (b) Consistent with `DialogTitle` sizing. (c) Style guide demos update automatically.
3. **Database Change:** No.
4. **Verdict:** Go.
