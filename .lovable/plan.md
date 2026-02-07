

# Fix: Transparent Background on Training Video Dialog

## The Problem

When you open a training video from the employee dashboard, the popup window appears see-through -- the page behind shows through, making text unreadable.

## Root Cause

The video player dialog puts `overflow-y-auto` directly on the outer dialog container. This conflicts with the dialog's built-in layout system and causes content to spill outside the area where the background color is painted. The dialog already has a built-in scrollable area component (`DialogScrollArea`) designed for exactly this purpose, but it's not being used here.

Additionally, the dialog redundantly sets `max-h-[90vh]` even though the base dialog component already includes that constraint, creating a double-constraint that compounds the layout issue.

## The Fix (1 file)

### `src/components/VideoPlayerFullscreen.tsx`

**Line 445** -- Remove the conflicting classes from DialogContent:

Change:
```
className="max-w-6xl w-[95vw] max-h-[90vh] overflow-y-auto"
```
To:
```
className="max-w-6xl w-[95vw]"
```

**Lines 463-549** -- Wrap the main content area in `DialogScrollArea` instead of a plain `<div>`:

Change:
```
<div>
  {/* description, video player, quiz, etc. */}
</div>
```
To:
```
<DialogScrollArea>
  {/* description, video player, quiz, etc. */}
</DialogScrollArea>
```

This requires importing `DialogScrollArea` -- it's already exported from the dialog component but not currently imported in this file (line 2).

## Why This Works

- The base dialog already constrains its height to 90% of the screen and uses a flex column layout
- `DialogScrollArea` is specifically designed to be the scrollable middle section -- it has `overflow-y-auto`, `flex-1`, and `min-h-0` so it fills available space between the header and footer while keeping scrolling contained
- The header and footer stay fixed in place; only the middle content scrolls
- The background color stays fully painted because nothing overflows the dialog boundary

## What Won't Change

- No visual changes beyond fixing the transparency
- No new components or dependencies
- Video playback, quiz flow, and all interactions remain identical
- The `VideoPlayerModal` (admin preview) already uses `DialogScrollArea` correctly and needs no changes

| Item | Detail |
|---|---|
| Files changed | 1 (`VideoPlayerFullscreen.tsx`) |
| Lines changed | ~3 (remove 2 classes, swap 1 wrapper tag, add 1 import) |
| Risk | Low -- uses the same pattern already working in `VideoPlayerModal` |

