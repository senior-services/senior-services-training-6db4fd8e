

## Compliance Timer for PPSX Trainings

### What Changes

Update the presentation training flow in `VideoPlayerFullscreen.tsx` to use a fixed 60-second countdown with the timer displayed in the footer button, replacing the current badge-based timer.

### Current vs. New Behavior

| Aspect | Current | New |
|--------|---------|-----|
| Timer duration | 80% of `duration_seconds` or 30s fallback | Fixed 60 seconds |
| Timer display | Badge in acknowledgment section ("Time Left: N") | Countdown in footer button ("Complete Training (0:59)") |
| Footer (no quiz) | No footer for presentations | Footer with "Cancel" and "Complete Training" buttons |
| Unlock feedback | Badge changes from warning to success | Button transitions from disabled to active with a subtle color/scale animation |

### Detailed Changes

**File: `src/components/VideoPlayerFullscreen.tsx`**

1. **Timer duration (line ~128-133):** Change `getMinimumViewingSeconds` to return a fixed `60` for presentations instead of the dynamic calculation.

2. **Remove badge timer from acknowledgment section (lines ~538-554):** Remove the `Badge` timer display from the inline acknowledgment area since the countdown moves to the footer button.

3. **Add presentation footer (after line ~687):** Add a new `DialogFooter` block for presentations without quizzes that aren't yet completed. It will contain:
   - A "Cancel" button (outline variant) that closes the dialog
   - A "Complete Training" button that:
     - Shows countdown when timer is active: `Complete Training (0:59)`
     - Is disabled until both the timer reaches zero AND the attestation checkbox is checked
     - Transitions to active state with a subtle animation (scale + color shift) when the timer completes

4. **Unlock animation:** Add a CSS transition class to the "Complete Training" button. When the timer reaches zero, toggle from a muted/disabled appearance to the primary button style with `transition-all duration-500` for a smooth unlock effect.

5. **Button countdown format:** Format remaining seconds as `M:SS` (e.g., `0:59`, `0:05`, `0:00`).

### Technical Details

**Timer logic** already exists (lines 174-197) and counts `viewingSeconds` upward. The countdown display is simply `60 - viewingSeconds`. No new timer mechanism is needed.

**Footer structure for presentations (non-quiz, not completed):**
```
DialogFooter (sm:justify-end)
  +-- Button (outline) "Cancel" --> onOpenChange(false)
  +-- Button (primary, disabled until timer=0 AND attestation checked)
        text: timer > 0 ? "Complete Training (M:SS)" : "Complete Training"
        onClick: handleCompleteTraining
        className: transition-all duration-500 (for unlock animation)
```

**Attestation section** remains in place below the presentation (lines 521-579) but without the badge timer since the countdown moves to the footer button.

### Review

- **Top 5 Risks:** (1) Fixed 60s may be too short/long for some content -- but matches user spec. (2) Removing badge timer reduces at-a-glance visibility while scrolled up -- mitigated by footer always being visible. (3) No database schema change. (4) No security impact. (5) Animation is CSS-only, no performance concern.
- **Top 5 Fixes:** (1) Set fixed 60s timer. (2) Move countdown to footer button text. (3) Add Cancel + Complete Training footer for presentations. (4) Add transition animation on unlock. (5) Remove redundant badge timer.
- **Database Change Required:** No
- **Go/No-Go:** Go

