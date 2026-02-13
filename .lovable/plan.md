## Refactor: Unified Training Dialog Footer System (Revised)

### Overview

Consolidate the current 5 separate `DialogFooter` blocks in `VideoPlayerFullscreen.tsx` into a single, state-driven footer component. Remove `CompletionOverlay.tsx` entirely. Standardize tooltip copy, exit confirmation copy, and add auto-scroll (video only) + transient success badge behaviors.

### Current State (Problems)

- **5 footer blocks** (lines 458-687) handle overlapping cases with duplicated AlertDialog markup
- `CompletionOverlay.tsx` exists but is unused by the main dialog (orphaned component)
- Tooltip copy is inconsistent across video vs. presentation paths
- No auto-scroll on content completion
- No transient "Video Completed" success badge in footer

### Architecture

The footer renders based on a single computed `footerState` derived from existing state variables:

```text
footerState = 
  wasEverCompleted          -> "completed"
  quizStarted && !submitted -> "quiz-active"  
  quizSubmitted             -> "quiz-done"
  else                      -> "content"  (covers all 4 use cases)
```

Within `"content"` state, the button label/disabled logic branches on `hasQuiz` and `isPresentation`.

### Files Changed

#### 1. `src/components/VideoPlayerFullscreen.tsx` (major edit)

**A. Add transient success badge state:**

```typescript
const [showVideoCompletedBadge, setShowVideoCompletedBadge] = useState(false);
```

In `handleVideoEnded`, trigger the badge and auto-fade:

```typescript
setShowVideoCompletedBadge(true);
setTimeout(() => setShowVideoCompletedBadge(false), 5000);
```

**B. Add auto-scroll on content completion (VIDEO ONLY):**  
When video reaches 99% progress, scroll to attestation/quiz area. Presentations do NOT auto-scroll when the timer completes.

```typescript
// Only for video trainings, in the videoReady effect
if (!isPresentation) {
  setTimeout(() => {
    document.getElementById('attestation-section')?.scrollIntoView({ behavior: 'smooth' });
  }, 200);
}
```

**C. Replace all 5 footer blocks with a single unified footer:**

The unified footer structure:

```text
+--------------------------------------------------+
| [Timer/Badge left]          [Cancel] [Primary]   |
+--------------------------------------------------+
```

- **Left zone**: Timer (presentation, active) OR "Video Completed" badge (video, transient 5s) OR "Training Completed" banner (wasEverCompleted) OR empty
- **Right zone**: Cancel (outline) + Primary Action (default), right-aligned

**D. Standardize tooltip copy:**


| Context                   | Tooltip                                                                 |
| ------------------------- | ----------------------------------------------------------------------- |
| Video not finished        | "Watch video to continue."                                              |
| Presentation timer active | "Finish viewing to continue."                                           |
| Checkbox not checked      | "Check the acknowledgement box above to proceed."                       |
| Quiz not complete         | "Complete the questions above and the final acknowledgement to submit." |


**E. Standardize exit confirmation copy:**


| Phase                      | Title                       | Description                                                                               |
| -------------------------- | --------------------------- | ----------------------------------------------------------------------------------------- |
| Content incomplete         | "Exit training?"            | "Your progress will not be saved and **your training** will remain incomplete.            |
| Content done, form pending | "Exit training?"            | "You haven't submitted the acknowledgement yet and your training will remain incomplete." |
| Quiz active, no changes    | "Exit training?"            | Same as content done                                                                      |
| Quiz active, has changes   | "Discard unsaved progress?" | "If you leave now, your answers won't be saved and your training will remain incomplete." |


**F. Primary button logic (content state):**


| Condition | Label                             | Disabled when                                            |
| --------- | --------------------------------- | -------------------------------------------------------- |
| Has quiz  | "Start Quiz to Complete Training" | Video not ready OR timer active                          |
| No quiz   | "Complete Training"               | Video not ready OR timer active OR attestation unchecked |


**G. Completed state footer:**
Banner "Training Completed" (left) + Close button (right). No Cancel button.

**H. Quiz-done state footer:**
Close button only, right-aligned.

#### 2. Delete `src/components/video/CompletionOverlay.tsx`

This component is superseded by the inline footer badge. Remove the file and any remaining imports.

#### 3. `src/components/shared/TrainingAttestation.tsx` (minor)

Add an `id="attestation-section"` to the outer `div` for auto-scroll targeting.

### Use Case Matrix


| Type         | Quiz | Timer | Footer Left | Footer Right               | Auto-Scroll  | Attestation Location  |
| ------------ | ---- | ----- | ----------- | -------------------------- | ------------ | --------------------- |
| Video        | No   | --    | Badge (5s)  | Cancel + Complete Training | Yes (on 99%) | Inline in scroll body |
| Video        | Yes  | --    | Badge (5s)  | Cancel + Start Quiz        | Yes (on 99%) | None (quiz has own)   |
| Presentation | No   | Yes   | Timer       | Cancel + Complete Training | No           | Inline in scroll body |
| Presentation | Yes  | Yes   | Timer       | Cancel + Start Quiz        | No           | Below quiz questions  |


### Review

1. **Top 3 Risks:** (a) Merging 5 footer blocks into 1 requires careful state coverage -- mitigated by explicit `footerState` enum. (b) Transient badge timeout needs cleanup on unmount -- mitigated by clearing timeout in effect cleanup. (c) Removing auto-scroll for presentations means users must manually scroll to attestation -- acceptable since timer completion is visually obvious in footer.
2. **Top 3 Fixes:** (a) Eliminates ~150 lines of duplicated AlertDialog markup. (b) Consistent tooltip/confirmation copy with proper "acknowledgement" terminology across all 4 use cases. (c) Video-only auto-scroll guides senior users to next action without jarring presentation UX.
3. **Database Change:** No.
4. **Verdict:** Go -- reduces complexity while adding polish for senior-focused UX.