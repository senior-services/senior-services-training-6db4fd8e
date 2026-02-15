

## Fix Checkbox Vertical Alignment in TrainingAttestation

### Changes in `src/components/shared/TrainingAttestation.tsx`

**1. Fix the span wrapper class (line 72)**

Change `className="inline-flex"` to `className="flex items-center"` on the `<span>` inside `TooltipTrigger`. This converts the wrapper to a flex container that vertically centers the checkbox, aligning it with the label text baseline.

**2. Standardize label spacing (line 99)**

The `<Label>` currently uses `ml-3` for spacing. This is fine and consistent -- no change needed here. The `ml-3` provides clean horizontal separation from both the bare `Checkbox` and the `span`-wrapped `Checkbox`.

### Summary
- One class change on line 72: `"inline-flex"` to `"flex items-center"`
- Single file, single line edit

### Review
1. **Top 3 Risks**: None -- purely visual fix.
2. **Top 3 Fixes**: (a) Checkbox aligns vertically with label. (b) Tooltip arrow remains centered via existing `align="center"`. (c) No spacing regressions since `ml-3` on label is unchanged.
3. **Database Change**: No.
4. **Verdict**: Go.

