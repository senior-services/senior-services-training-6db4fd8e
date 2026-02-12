

## Final Structural Restoration: "Sandwich" Layout

### Goal
Restore the fixed header / scrollable body / fixed footer layout so header and footer are always visible, and only the middle content scrolls.

### Current vs. Target Structure

```text
CURRENT (everything scrolls together):
FullscreenDialogContent (flex-col, overflow-hidden)
  +-- div[scrollable] (flex-1 overflow-y-auto, px-6 pb-6 pt-0)
        +-- DialogHeader (pt-6 pb-4 px-0 border-b)
        +-- content wrapper div
        +-- DialogFooter (px-0 py-6 mt-6 border-t)
        +-- DialogFooter (px-0 py-6 mt-6 border-t)

TARGET (sandwich):
FullscreenDialogContent (flex-col, overflow-hidden)
  +-- DialogHeader (flex-shrink-0) -- no className override, inherits primitive defaults
  +-- div[scrollable] (flex-1 overflow-y-auto p-6 flex flex-col gap-6)
  |     +-- description, video/slides, quiz, attestation
  +-- DialogFooter (flex-shrink-0) -- no className override, inherits primitive defaults
```

### Technical Changes (single file: `src/components/VideoPlayerFullscreen.tsx`)

**1. Move DialogHeader outside the scrollable div (lines 427-432)**

Extract `DialogHeader` from inside the scrollable div and place it as a direct child of `FullscreenDialogContent`, before the scrollable div. Remove all className overrides (`pt-6 pb-4 px-0 border-b`) so it inherits the primitive defaults (`px-6 py-4 border-b flex-shrink-0`).

```tsx
<FullscreenDialogContent ...>
  <DialogHeader>
    <DialogTitle>{video?.title || 'Training Video'}</DialogTitle>
  </DialogHeader>
  <div ref={scrollRef} className="flex-1 overflow-y-auto min-h-0 w-full p-6 flex flex-col gap-6" data-dialog-scroll-area>
    {/* content starts here -- no inner wrapper div needed, gap-6 handles spacing */}
```

**2. Flatten the content wrapper (line 433)**

Remove the inner `<div className="flex flex-col gap-6 pt-6">` wrapper. The scrollable div itself now carries `flex flex-col gap-6`, so the description block, video container, quiz section, and attestation become direct children. Remove `pt-6` since the scrollable div's `p-6` already provides top spacing.

**3. Move both DialogFooter blocks outside the scrollable div (lines 488-649)**

Move the two `DialogFooter` blocks (quiz footer at line 489 and presentation footer at line 548) from inside the scrollable div to after the closing `</div>` of the scrollable div, as direct children of `FullscreenDialogContent`. Remove all className overrides (`px-0 py-6 mt-6 border-t`) so they inherit primitive defaults (`px-6 py-4 border-t flex-shrink-0`).

**4. Harden scroll reset (line 414-424)**

The existing `onOpenAutoFocus` handler already resets `scrollRef.current.scrollTop = 0` inside a `setTimeout`. No change needed here -- with the header outside the scroll area, `scrollTop = 0` correctly shows the top of the content.

**5. Add autoFocus={false} to ContentPlayer**

Pass `autoFocus={false}` to the `ContentPlayer` component (line 452) to prevent the browser from scrolling to embedded iframes on dialog open. If `ContentPlayer` does not currently accept this prop, the `tabIndex={0}` on the parent `data-video-container` div already handles focus, and the `e.preventDefault()` in `onOpenAutoFocus` blocks native autofocus. This step may be a no-op if the iframe focus is already suppressed.

**6. Senior-First Compliance Verification**

- `DialogTitle` renders as a bare tag with no inline overrides -- it inherits `.text-h3` (25px, weight 600) from the global CSS. Per the user's request for `.text-h4`, this would change to 20px/600 weight. This is a design decision.
- Footer buttons use the `Button` primitive which inherits `.text-body` (16px) from the global CSS. No change needed.

### Summary

| Area | Change |
|------|--------|
| DialogHeader | Moved outside scrollable div; no className override; inherits primitive `px-6 py-4 border-b flex-shrink-0` |
| Scrollable div | `className="flex-1 overflow-y-auto min-h-0 w-full p-6 flex flex-col gap-6"` |
| Content wrapper | Removed inner wrapper div; children become direct children of scrollable div |
| Both DialogFooters | Moved outside scrollable div; no className override; inherits primitive `px-6 py-4 border-t flex-shrink-0` |
| Scroll reset | No change needed -- existing logic handles it |
| autoFocus | Already suppressed by `onOpenAutoFocus` `e.preventDefault()` |

### Review

1. **Top 3 Risks:** (a) Footer is now always visible, reducing vertical space for video by ~56px -- acceptable for senior legibility. (b) Two conditional DialogFooters render as siblings; only one shows at a time due to conditional logic, so no double-footer risk. (c) The `DialogTitle` scale step (h3 vs h4) needs a design decision from the user.
2. **Top 3 Fixes:** (a) Header and footer permanently visible with consistent borders. (b) No negative-margin hacks or padding overrides on primitives. (c) Scroll position guaranteed at top on open.
3. **Database Change:** No.
4. **Verdict:** Go.
