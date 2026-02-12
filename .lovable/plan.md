

## Surgical Fix: Restore Header/Footer Visibility and Fix Auto-Scroll

### Problem

The header is currently **inside** the scrollable `div`, which causes two issues:
1. The "X" close button (absolutely positioned in the dialog primitive at `right-4 top-3.5`) floats over scrolling content instead of anchoring next to the header.
2. The negative-margin hack (`-mx-6 -mt-6`) fights the parent padding and creates visual glitches.
3. The scroll-reset `useEffect` fires but the browser's `onOpenAutoFocus` handler can re-scroll the container after the reset runs.

### Solution

Move `DialogHeader` back **outside** the scrollable div as a direct child of `FullscreenDialogContent`. This makes the header fixed at the top (using the primitive's built-in `flex-shrink-0`), the close button stays aligned, and only the middle area scrolls.

### Changes (single file: `src/components/VideoPlayerFullscreen.tsx`)

**1. Move DialogHeader above the scrollable div**

Current structure (lines 500-505):
```tsx
<div ref={scrollRef} className="flex-1 overflow-y-auto min-h-0 w-full p-6 flex flex-col gap-6" data-dialog-scroll-area>
  <DialogHeader className="-mx-6 -mt-6 px-6 py-4 border-b flex-shrink-0">
    <DialogTitle>{video?.title || 'Training Video'}</DialogTitle>
  </DialogHeader>
  ...
</div>
```

New structure:
```tsx
<DialogHeader>
  <DialogTitle>{video?.title || 'Training Video'}</DialogTitle>
</DialogHeader>
<div ref={scrollRef} className="flex-1 overflow-y-auto min-h-0 w-full p-6 flex flex-col gap-6" data-dialog-scroll-area>
  ...
</div>
```

The `DialogHeader` now has **no className override** -- it inherits the primitive's built-in `px-6 py-4 border-b flex-shrink-0` from `dialog.tsx` line 87. The `data-dialog-header` attribute on the primitive prevents the catch-all padding selector from firing.

**2. Harden the scroll reset**

The current `useEffect` fires on `[open, videoId]`, but the `onOpenAutoFocus` handler runs a 100ms `setTimeout` that can re-scroll the container. Add a second reset inside that same timeout callback:

```tsx
// In the onOpenAutoFocus handler (line 492-496), after focusing the video container:
if (scrollRef.current) {
  scrollRef.current.scrollTop = 0;
}
```

This guarantees the scroll resets **after** the focus shift, eliminating the jump.

**3. Footer -- no changes needed**

The `DialogFooter` is already outside the scrollable div and uses the primitive's `px-6 py-4 border-t flex-shrink-0`. Confirmed correct.

### Summary

| Area | Change |
|------|--------|
| DialogHeader | Moved outside scrollable div; removed all className overrides; inherits primitive defaults |
| Scroll reset | Added secondary `scrollTop = 0` inside the `onOpenAutoFocus` setTimeout callback |
| Scrollable div | Unchanged (`flex-1 overflow-y-auto min-h-0 w-full p-6 flex flex-col gap-6`) |
| Footer | No change |

### Review

1. **Risks:** The header no longer scrolls away -- it is permanently visible. This is the requested behavior. Content area is slightly shorter by the header height (~56px).
2. **Fixes:** Header border restored via primitive defaults; X button anchored to header area; scroll position guaranteed to start at 0; footer remains pinned and consistent.
3. **Database Change:** No.
4. **Verdict:** Go.
