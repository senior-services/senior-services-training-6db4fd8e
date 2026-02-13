

## Hide Dialog Footer for Completed Trainings

### Problem
When a user opens a training they have already completed, the footer still renders a "Training Completed" banner and a "Close" button. The request is to remove the footer entirely for completed trainings, since the completion state is already communicated elsewhere.

### Change

**`src/components/VideoPlayerFullscreen.tsx`** -- single change

Currently (line 486), the `wasEverCompleted` branch renders a footer with a banner and Close button. Instead, return `null` so no `DialogFooter` content is rendered:

```typescript
// State: completed
if (wasEverCompleted) {
  return null;
}
```

This removes the 6-line block (lines 487-496) that renders the banner and Close button, replacing it with a single `return null`. The user can still close the dialog via the header's X button.

### Review
1. **Top 3 Risks:** (a) Users lose the explicit "Close" button in the footer -- mitigated by the X button in the dialog header. (b) The "Training Completed" banner in the footer is removed -- if this visual confirmation is still needed, it could be moved to the body instead. (c) No other states affected.
2. **Top 3 Fixes:** (a) Clean removal of footer for completed state. (b) No new code or complexity. (c) Consistent with the request.
3. **Database Change:** No.
4. **Verdict:** Go -- straightforward removal.

