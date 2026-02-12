

## Unify Fullscreen Dialog Architecture and Eliminate CompletionOverlay

### Overview

Replace the floating `CompletionOverlay` modal with an inline `TrainingAttestation` inside the scrollable body, and add a unified `DialogFooter` for all uncompleted video trainings. This aligns videos with the same pattern already used by presentations.

---

### Change 1 -- Remove CompletionOverlay import and all overlay state (lines 19, 71-72, 244-274, 356-358, 462-463)

**Remove:**
- Import of `CompletionOverlay` (line 19)
- State variables: `showCompletionOverlay`, `overlayDismissed` (lines 71-72)
- The three overlay-related `useEffect` hooks (lines 244-253, 255-266, 268-274)
- The `handleCloseOverlay` callback (lines 356-358)
- The `CompletionOverlay` JSX render (line 463)
- References to `overlayDismissed` in initialization (line 165: `setOverlayDismissed(true)`)
- Reset of `overlayDismissed` and `showCompletionOverlay` in init cleanup (lines 143-144)

**Also remove:** The "Persistent Quiz CTA Button" block (lines 452-457) since the footer will handle this.

---

### Change 2 -- Add video attestation state

Add a new state variable for non-quiz video attestation:

```tsx
const [videoAttestationChecked, setVideoAttestationChecked] = useState(false);
```

Reset it to `false` when the dialog closes (in the init cleanup block).

---

### Change 3 -- Add a new state: `videoReady` to track when video has ended or progress >= 99

Instead of the overlay, use a derived boolean:

```tsx
const videoReady = !isPresentation && progress >= 99;
```

This controls when the attestation and footer actions appear for video-type trainings.

---

### Change 4 -- Add TrainingAttestation for non-quiz videos in the scrollable body (after the video container, ~line 464)

```tsx
{/* Attestation for non-quiz video trainings */}
{videoReady && !wasEverCompleted && !quiz && !quizLoading && (
  <TrainingAttestation
    enabled={true}
    checked={videoAttestationChecked}
    onCheckedChange={setVideoAttestationChecked}
    disabledTooltip=""
  />
)}
```

This appears inline below the video player once the video ends or is at 99%+.

---

### Change 5 -- Add unified video footer for all uncompleted video trainings (after presentation footer, before closing tags)

```tsx
{/* Fixed Footer - Video trainings (non-presentation, non-quiz-started) */}
{!isPresentation && !wasEverCompleted && videoReady && !quizStarted && (
  <DialogFooter>
    <div className="flex w-full items-center justify-end gap-4">
      {quizLoading ? null : quiz ? (
        <Button onClick={handleStartQuiz}>
          Start Quiz to Complete Training
        </Button>
      ) : (
        videoAttestationChecked ? (
          <Button onClick={handleCompleteTraining}>
            Complete Training
          </Button>
        ) : (
          <ButtonWithTooltip
            tooltip="Please check the acknowledgment checkbox above to proceed."
            disabled
          >
            Complete Training
          </ButtonWithTooltip>
        )
      )}
    </div>
  </DialogFooter>
)}
```

The existing quiz footer (lines 497-552) continues to handle the quiz-started state. It only needs the condition `quizStarted` to remain (which it already has).

---

### Change 6 -- Update `handleCompleteTraining` to not reference overlay

Remove `setShowCompletionOverlay(false)` from `handleCompleteTraining` (line 299). Also ensure it resets `videoAttestationChecked`.

---

### Change 7 -- Update `handleStartQuiz` to not reference overlay

Remove `setShowCompletionOverlay(false)` and `setOverlayDismissed(true)` from `handleStartQuiz` (lines 342-343).

---

### Change 8 -- Update `handleVideoEnded` to not reference overlay

Remove `setShowCompletionOverlay(true)` from `handleVideoEnded` (line 280). The footer and attestation are now driven by `videoReady` (progress >= 99).

---

### Change 9 -- Ensure `autoFocus={false}` on video container

The `data-video-container` div already has `tabIndex={0}`. The `onOpenAutoFocus` handler (line 422) already prevents default and manually resets scroll. No additional change needed -- the `ContentPlayer` doesn't render native `<video autoFocus>`. Verified safe.

---

### Change 10 -- Scroll reset

Already implemented via the `scrollRef` useEffect (lines 173-177) and the `onOpenAutoFocus` handler (lines 422-432). No change needed.

---

### Change 11 -- Footer button sizing

Remove any `shadow-md hover:shadow-lg transition-shadow` utility overrides from footer buttons. The `Button` primitive already handles sizing. No manual `h-` or `py-` overrides exist currently -- confirmed clean.

---

### Files Changed

| File | Action |
|------|--------|
| `src/components/VideoPlayerFullscreen.tsx` | Major refactor: remove overlay logic, add inline attestation + unified footer |
| `src/components/video/CompletionOverlay.tsx` | Delete file (no longer used) |

---

### State Flow After Refactor

For a **video without quiz**:
1. User opens training -- video plays, no footer visible (progress < 99)
2. Video ends or reaches 99% -- `videoReady` becomes true
3. `TrainingAttestation` appears below video in scrollable body
4. `DialogFooter` appears with disabled "Complete Training" button
5. User checks attestation -- "Complete Training" enables
6. User clicks -- `markComplete()` fires, `wasEverCompleted` becomes true, footer hides

For a **video with quiz**:
1. Same as above until step 3
2. No attestation shown (quiz handles it)
3. Footer shows "Start Quiz to Complete Training" button
4. User clicks -- quiz starts, footer switches to quiz footer with Cancel/Submit
5. User completes quiz -- `markComplete()` fires, footer hides

---

### Review

1. **Top 3 Risks:** (a) Removing the overlay means users no longer get a celebratory "Video Completed!" moment -- the UX is now functional-first. (b) The `videoReady` boolean is derived from `progress >= 99`; if progress tracking is unreliable for some video types, the footer may not appear. (c) The existing quiz footer condition (`quizStarted || quizSubmitted`) must not conflict with the new video footer condition (`!quizStarted`).
2. **Top 3 Fixes:** (a) Single architectural pattern for all training types. (b) Footer always visible for uncompleted trainings once video ends. (c) No more floating overlay z-index issues.
3. **Database Change:** No.
4. **Verdict:** Go.
