
## Fix Tooltip Arrow Visibility and Add Styleguide Examples

### Issue 1: Tooltip arrow not visible on attestation checkbox
From the screenshot, the tooltip appears without an arrow. The `TooltipContent` component already includes the arrow, but the tooltip is rendering on the `side="top"` with `align="start"`. The arrow is present in the component but may be clipped by the `overflow-hidden` class on `TooltipContent`. Removing `overflow-hidden` will allow the SVG arrow to render outside the tooltip box.

### Issue 2: Tooltip examples missing from Components Gallery
The gallery currently has only one generic tooltip example buried in the "Interactive" section. A dedicated "Tooltips" section with all three alignment variants (start, center, end) needs to be added.

### Changes (2 files)

**File 1: `src/components/ui/tooltip.tsx`**
- Remove `overflow-hidden` from the `TooltipContent` className. This class clips the arrow SVG since it renders outside the content box. The tooltip content itself doesn't need overflow clipping.

**File 2: `src/pages/ComponentsGallery.tsx`**
- Add a "Tooltips" anchor link in the navigation section
- Add a dedicated "Tooltips" Card section with three live examples:
  - **Center-aligned** (default) -- arrow centered under tooltip
  - **Start-aligned** (`align="start"`) -- arrow on the left
  - **End-aligned** (`align="end"`) -- arrow on the right
- Each example uses a Button trigger so users can hover and see the arrow position

### Technical Details

The root cause of the missing arrow: `overflow-hidden` on the `TooltipPrimitive.Content` element clips the `TooltipPrimitive.Arrow` SVG, which is positioned outside the content box boundary. Removing it is safe because tooltip content wraps naturally via `max-w-[300px]`.

### Review
- **Top 5 Risks**: (1) Removing `overflow-hidden` could allow very long unbroken strings to overflow -- mitigated by `max-w-[300px]` and normal word wrapping. (2) No impact on existing tooltips beyond making arrows visible. (3) No layout shift. (4) No database impact. (5) No security impact.
- **Top 5 Fixes**: (1) Remove `overflow-hidden` from TooltipContent. (2) Add Tooltips section to ComponentsGallery. (3) Add nav anchor link. (4-5) N/A.
- **Database Change Required**: No
- **Go/No-Go**: Go
