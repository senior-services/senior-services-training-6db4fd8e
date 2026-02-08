

## Fix Mismatched Tab Trigger Heights

### The Problem

The "Quiz" tab trigger has a custom `className="flex items-center gap-2"` that overrides the default `inline-flex` display, causing it to render slightly taller than the "Details" tab. This creates uneven spacing between the "Details" text and the bottom border line.

### The Fix

Remove the custom `flex items-center gap-2` from the Quiz tab trigger. The base `TabsTrigger` component already applies `inline-flex items-center`, so only `gap-2` is needed for spacing between the text and the badge.

### Principal Engineer Review

**Top 5 Risks/Issues:**
1. Visual-only change -- no logic or data impact
2. Removing `flex` restores the default `inline-flex` behavior, which is the intended design
3. No accessibility concern
4. No layout shift risk -- badge will still render inline with text
5. No other components affected

**Top 5 Fixes/Improvements:**
1. Change `className="flex items-center gap-2"` to `className="gap-2"` on the Quiz TabsTrigger (line 792)
2. This preserves the gap for the badge while using the component's built-in `inline-flex items-center`
3. Both tabs will now share identical height and alignment
4. Single prop change in one file
5. No other files affected

**Database Change Required:** No

**Go/No-Go Verdict:** Go -- one-line className cleanup to fix tab height mismatch.

### Technical Details

**`src/components/EditVideoModal.tsx` (line 792):**
- Change: `className="flex items-center gap-2"` to `className="gap-2"`

