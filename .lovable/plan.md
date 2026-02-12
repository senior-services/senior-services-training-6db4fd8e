

## Apply `max-w-4xl mx-auto` to Post-Quiz Attestation Container

### Problem
The `TrainingAttestation` container that appears after quiz questions is full-width, while the quiz questions themselves are constrained to `max-w-4xl`. This creates a visual mismatch.

### Change (1 file)

**`src/components/VideoPlayerFullscreen.tsx`** -- line 551

| Before | After |
|--------|-------|
| `<div className="mt-6">` | `<div className="mt-6 max-w-4xl mx-auto">` |

This wrapping `<div>` around `TrainingAttestation` gains the same width constraint as the quiz question container, centering it consistently.

### Review
1. **Risks:** None -- purely cosmetic alignment change on a single wrapper div.
2. **Fixes:** Attestation card visually aligns with quiz content above it.
3. **Database Change:** No
4. **Verdict:** Go -- one-line edit.

