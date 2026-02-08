

## Fix Tab Trigger Height Mismatch (Details vs Quiz)

### The Problem

The previous fix (removing `flex` from the Quiz trigger) didn't resolve the gap. The real cause is the **Badge component inside the Quiz tab** — it has built-in vertical padding (`py-0.5`) and border that make the Quiz trigger taller than the Details trigger. This extra height pushes the "Details" text away from the bottom border line.

### The Fix

Add a `leading-none py-0` override on the Badge inside the Quiz tab trigger so it doesn't increase the trigger's overall height. This keeps the badge visually present but prevents it from stretching the tab button.

### Principal Engineer Review

**Top 5 Risks/Issues:**
1. Visual-only change -- no logic or data impact
2. The badge text may appear slightly more compact, but at `text-xs` this is minimal
3. No accessibility concern -- badge still visible and readable
4. No other badges in the app are affected (scoped override via className)
5. No layout shift risk for the rest of the dialog

**Top 5 Fixes/Improvements:**
1. Add `py-0 leading-none` to the Badge className on the Quiz trigger (line 794)
2. This neutralizes the badge's vertical padding so it doesn't stretch the parent
3. Both tabs will now render at identical height
4. Single prop change in one file
5. No other files or components affected

**Database Change Required:** No

**Go/No-Go Verdict:** Go -- one className addition to fix the actual root cause.

### Technical Details

**`src/components/EditVideoModal.tsx` (line 794):**
- Change: `className="text-xs"` to `className="text-xs py-0 leading-none"`

