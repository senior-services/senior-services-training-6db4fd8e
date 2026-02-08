

## Make Vertical Spacing Consistent Between Tabs

### The Problem

The Details tab and Quiz tab in the Edit Course dialog have slightly different vertical spacing between the tab bar and the first piece of content. The Quiz tab has extra wrapper divs that create additional top spacing before the first question card, while the Details tab goes directly into the video preview with just `mt-2`.

### The Fix

Increase the Details tab's top margin from `mt-2` to `mt-4` to match the effective spacing seen in the Quiz tab, where nested wrapper divs create additional distance before the first content element.

### Principal Engineer Review

**Top 5 Risks/Issues:**
1. Visual-only change -- no logic or data impact
2. Very minor layout shift on the Details tab -- video preview moves down slightly
3. No accessibility concern
4. No other tabs or dialogs affected
5. No risk of breaking other components

**Top 5 Fixes/Improvements:**
1. Change `mt-2` to `mt-4` on the Details tab's `TabsContent` (line 800)
2. Also clean up the empty wrapper divs in the Quiz tab to simplify the markup (lines 835-839)
3. Ensure both tabs use the same `mt-4` value for consistency
4. Single file change
5. No other files affected

**Database Change Required:** No

**Go/No-Go Verdict:** Go -- minor spacing alignment, one file.

### Technical Details

**`src/components/EditVideoModal.tsx`:**

1. **Line 800** -- Details tab: change `mt-2` to `mt-4`
2. **Line 834** -- Quiz tab: change `mt-2` to `mt-4` (keep consistent)
3. **Lines 835-839** -- Remove the empty nested wrapper divs in the Quiz tab to clean up redundant markup

