

## Fix Quiz Footer Button Alignment

### Problem
The `DialogFooter` uses `sm:justify-between` to create a left/right split for the timer view. But when the quiz is active, there is no timer -- only a single `<div>` of buttons. With `justify-between` and one child, the buttons default to the left side.

### Fix (1 file)

**`src/components/VideoPlayerFullscreen.tsx`** -- line 611

Add `ml-auto` to the quiz buttons wrapper so it pushes itself to the right:

```text
Before:  <div className="flex gap-2">
After:   <div className="flex gap-2 ml-auto">
```

This ensures the Cancel and Submit Quiz buttons stay right-aligned when there is no timer present, while the timer view continues to work with `justify-between`.

### Review
1. **Risks:** None -- single class addition.
2. **Fixes:** Quiz footer buttons pinned to far right.
3. **Database Change:** No.
4. **Verdict:** Go.
