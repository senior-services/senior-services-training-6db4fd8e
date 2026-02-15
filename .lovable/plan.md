

## Fix Tooltip Arrow Alignment and Standardize Header

### Changes in `src/components/shared/TrainingAttestation.tsx`

**1. Center the tooltip arrow over the checkbox**

Change `align="start"` to `align="center"` on `TooltipContent` (line 82). The checkbox is a small square element, so `"center"` will place the arrow at its midpoint rather than the left edge.

**2. Verify span wrapper**

The `<span className="inline-flex">` wrapping the disabled `Checkbox` inside `TooltipTrigger asChild` is already correctly in place (lines 72-80). No change needed.

**3. Standardize the section header**

Replace the current `<p className="font-bold text-foreground">` (line 58) with `<h3 className="form-section-header !mt-0">`. This:
- Uses the semantic `h3` tag instead of `p`
- Applies the centralized `.form-section-header` class (which already includes `font-bold` and `text-foreground`)
- Adds `!mt-0` to remove the default top margin since it sits at the top of its container (consistent with `PersonSettingsModal` and `TrainingSettingsModal` usage)
- Removes the manual `font-bold text-foreground` utilities

### Files Modified
- `src/components/shared/TrainingAttestation.tsx` (two lines changed)

### Review
1. **Top 3 Risks**: None -- purely presentational, no logic changes.
2. **Top 3 Fixes**: (a) Arrow centers on checkbox. (b) Header uses semantic `h3` with design system class. (c) No utility overrides on the heading.
3. **Database Change**: No.
4. **Verdict**: Go.

