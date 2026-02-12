

## Move Presentation Timer to Dialog Footer (Bottom-Left)

### Change (1 file)

**`src/components/VideoPlayerFullscreen.tsx`** -- 2 edits

**Edit 1: Remove timer from scroll area (lines 505-515)**
Delete the timer Banner block from the description row inside `DialogScrollArea`.

**Edit 2: Add timer to footer (inside the pre-quiz/no-quiz branch, lines 668-704)**
Insert the timer Banner as the first element inside the `<>` fragment (line 669), before the Cancel button. The footer already uses `sm:justify-between`, so placing the timer on the left and keeping Cancel + action buttons on the right is straightforward.

Structure after change:
```text
DialogFooter (sm:justify-between)
  [LEFT]  Timer Banner (or "Minimum time met")
  [RIGHT] Cancel | Action Button
```

The timer block renders conditionally (`isPresentation && !wasEverCompleted`), so for video content or already-completed presentations, the footer layout is unchanged.

When the quiz is active (`quizStarted`), the footer switches to the quiz-submit branch (line 632+), so the timer naturally disappears -- no extra logic needed.

### Detail

```text
Footer layout:

  +--------------------------------------------------+
  | [i] Minimum review time: 2:30   Cancel | Start.. |
  +--------------------------------------------------+

  or after timer completes:

  +--------------------------------------------------+
  | [check] Minimum time met     Cancel | Complete.. |
  +--------------------------------------------------+
```

### Review
1. **Risks:** None -- the timer is purely presentational and all state variables are already in scope at the footer level.
2. **Fixes:** Timer is always visible and pinned bottom-left, freeing up scroll area space.
3. **Database Change:** No.
4. **Verdict:** Go -- cut/paste of one block within the same component.

