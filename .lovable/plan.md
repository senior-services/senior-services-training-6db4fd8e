

## Fix Squished Quiz Question Count Badge

### The Problem

The quiz question count badge on the Edit Course dialog's Quiz tab has custom size overrides (`px-1.5 py-0.5 h-5`) that make it appear smaller and more cramped than the standard tertiary badge shown in the component gallery.

### The Fix

Remove the custom sizing overrides so the badge uses the default badge dimensions (`px-2.5 py-0.5`), matching the component gallery appearance. The `min-w-[20px]` can also be removed since the default padding will handle spacing naturally.

### Principal Engineer Review

**Top 5 Risks/Issues:**
1. Very minor visual-only change -- no logic or data impact
2. Badge will be slightly wider, which could affect tab layout spacing -- but tabs have flexible space
3. No accessibility concern -- larger touch target is actually better
4. No other badges in the app use this same custom override pattern
5. No risk of breaking other components

**Top 5 Fixes/Improvements:**
1. Remove `className="text-xs px-1.5 py-0.5 min-w-[20px] h-5"` from the Badge on the Quiz tab
2. Keep `variant="tertiary"` and the `text-xs` class (consistent with typography standards for badges)
3. Single line change in `EditVideoModal.tsx`
4. Result matches the component gallery exactly
5. No other files affected

**Database Change Required:** No

**Go/No-Go Verdict:** Go -- one-line CSS cleanup to match design system standards.

### Technical Details

**`src/components/EditVideoModal.tsx` (~line 794):**
- Change: `className="text-xs px-1.5 py-0.5 min-w-[20px] h-5"` to `className="text-xs"`
- This removes the custom padding and height overrides, letting the badge use its default sizing from the design system

