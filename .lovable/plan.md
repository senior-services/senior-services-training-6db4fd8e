

## Refactor DialogFooter for Consistent Height Across All States

### Root Cause
The `DialogFooter` base class uses `flex-col-reverse sm:flex-row` to handle button stacking on mobile. When layout-specific overrides like `items-center` are added at the usage site, and different branches produce children with varying internal structures, the footer height becomes inconsistent -- particularly when switching between the pre-quiz view (timer + buttons) and the quiz view (buttons only).

The fundamental problem is that layout intent (left/right split vs. right-aligned) is being mixed between the `DialogFooter` className and its children, causing unpredictable height behavior.

### Solution: Single-child wrapper pattern

Each branch inside the footer should render exactly **one** full-width flex container that owns its own alignment. The `DialogFooter` itself stays clean with no layout overrides.

### Changes (1 file)

**`src/components/VideoPlayerFullscreen.tsx`**

**1. Remove `items-center` from DialogFooter (line 609)**

```text
Before:  <DialogFooter className="items-center">
After:   <DialogFooter>
```

Each branch already handles its own vertical alignment internally, so the shared `items-center` is unnecessary and contributes to height inflation on mobile.

**2. Normalize the quiz branch wrapper (line 611)**

```text
Before:  <div className="flex gap-2 ml-auto">
After:   <div className="flex w-full items-center justify-end gap-2">
```

This mirrors the pre-quiz branch pattern: a single full-width child that controls its own horizontal distribution. Using `justify-end` instead of `ml-auto` ensures consistent behavior with the flex-col-reverse base.

**3. Pre-quiz branch (line 657)** -- already correct from last edit, no change needed.

### Why this prevents recurrence

Both branches now follow the same structural contract:
- Footer renders one child: a `div` with `flex w-full items-center` and either `justify-between` (pre-quiz) or `justify-end` (quiz).
- The `DialogFooter` component stays vanilla -- no layout overrides at the call site.
- Height is determined solely by the button/banner height inside each branch, which is consistent.

### Review
1. **Risks:** None -- layout-only, removes problematic overrides.
2. **Fixes:** Footer height stays constant across pre-quiz and quiz states; pattern is now repeatable.
3. **Database Change:** No.
4. **Verdict:** Go.

