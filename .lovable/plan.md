

## Change Quiz Question Count Badge to Soft Tertiary

### The Change

Update the quiz question count badge variant from `tertiary` to `soft-tertiary` in the Edit Course dialog's Quiz tab.

### Principal Engineer Review

**Top 5 Risks/Issues:**
1. No risks -- single prop value change
2. No logic, data, or accessibility impact
3. `soft-tertiary` is already defined in the badge component (`text-muted-foreground bg-muted`)
4. No other files affected
5. No layout shift -- same sizing

**Top 5 Fixes/Improvements:**
1. Change `variant="tertiary"` to `variant="soft-tertiary"` on line 794 of `EditVideoModal.tsx`
2. Single prop change, no other modifications needed
3. Visual result: muted gray text on light gray background instead of white text on dark gray
4. Consistent with the project's soft variant pattern used elsewhere for status badges
5. Matches component gallery soft-tertiary appearance

**Database Change Required:** No

**Go/No-Go Verdict:** Go -- one prop change.

### Technical Details

**`src/components/EditVideoModal.tsx` (line 794):**
- Change: `variant="tertiary"` to `variant="soft-tertiary"`

