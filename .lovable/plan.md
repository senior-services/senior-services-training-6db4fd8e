

## Correct Tooltip Targeting on Training Attestation Checkbox

### Problem
The tooltip currently wraps the **entire attestation card** (`TooltipTrigger asChild` around the whole `content` div). This means hovering anywhere on the card triggers the tooltip, rather than just hovering over the checkbox itself.

### Changes

**`src/components/shared/TrainingAttestation.tsx`**

Restructure the component so the Tooltip wraps only the Checkbox (not the entire card):

1. **Move tooltip inside the card**: Instead of the current pattern where the disabled branch wraps the whole `content` block in a `<Tooltip>`, integrate the tooltip directly around the `<Checkbox>` element within the card's render.

2. **Wrap only the Checkbox in TooltipTrigger**: When `!enabled && disabledTooltip`, wrap the `<Checkbox>` in a `<span>` inside `<TooltipTrigger asChild>` (the span is needed because disabled elements don't fire hover events).

3. **Set TooltipContent props**: `side="top"`, `align="start"`, `sideOffset={8}`. The arrow is already rendered by the shared `TooltipContent` component (line 28 of `tooltip.tsx` -- `<TooltipPrimitive.Arrow className="fill-foreground" />`), so no additional arrow insertion is needed.

4. **Remove the outer wrapping pattern**: Delete the `if (!enabled && disabledTooltip)` branch (lines 93-105) that currently wraps the entire card.

**Before (simplified):**
```
if disabled:
  <Tooltip>
    <TooltipTrigger asChild>
      <entire-card />        // tooltip on whole card
    </TooltipTrigger>
    <TooltipContent />
  </Tooltip>
else:
  <entire-card />
```

**After (simplified):**
```
<entire-card>
  ...
  {disabled && disabledTooltip ? (
    <Tooltip>
      <TooltipTrigger asChild>
        <span>              // interactive wrapper for disabled checkbox
          <Checkbox disabled />
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" align="start" sideOffset={8}>
        <p>{disabledTooltip}</p>
      </TooltipContent>
    </Tooltip>
  ) : (
    <Checkbox />
  )}
  <Label />
</entire-card>
```

### Files Modified
- `src/components/shared/TrainingAttestation.tsx` (restructure tooltip to target checkbox only, remove outer card wrapping)

### Review
1. **Top 3 Risks**: (a) Disabled checkboxes don't fire pointer events -- the `span` wrapper with `asChild` ensures hover works. (b) The arrow is already baked into `TooltipContent` via the shared primitive -- no duplicate needed. (c) `sideOffset={8}` provides clean spacing above the small checkbox target.
2. **Top 3 Fixes**: (a) Tooltip trigger scoped to checkbox only. (b) Proper positioning with `side="top"` + `align="start"`. (c) Removes the whole-card tooltip wrapping anti-pattern.
3. **Database Change**: No.
4. **Verdict**: Go -- single file, clean restructure.
