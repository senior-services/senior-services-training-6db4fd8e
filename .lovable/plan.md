

## Fix: YouTube Seek Timing Race

### Root Cause
The YouTube `onReady` callback fires ~1 second before `loadExistingProgress` resolves from the database. Since the seek logic only lives inside `onReady` (which fires once), when `initialSeekSeconds` later updates from `0` to `23`, nothing acts on it.

Same issue applies to HTML5 `onLoadedMetadata` — it fires once before the async value arrives.

### Fix — `src/components/video/VideoPlayer.tsx`

Add a `useEffect` that watches `initialSeekSeconds` and performs a late seek if the player is already ready:

1. Track "player ready" state via a ref (`ytPlayerReadyRef`), set to `true` in `onReady`.
2. Add a `useEffect` that runs when `initialSeekSeconds` changes:
   - If YouTube player exists and is ready, and `initialSeekSeconds > 0`, call `ytPlayerRef.current.seekTo(initialSeekSeconds, true)`.
   - If HTML5 video ref exists and `initialSeekSeconds > 0`, set `videoRef.current.currentTime = initialSeekSeconds`.
3. Keep the existing `onReady`/`onLoadedMetadata` seek logic as-is (handles the case where DB loads before player ready).

This covers both orderings: DB-first and player-first.

### Files Changed

| File | Change |
|------|--------|
| `src/components/video/VideoPlayer.tsx` | Add `ytPlayerReadyRef`, set in `onReady`; add `useEffect` to seek when `initialSeekSeconds` changes after player is ready |

### Database Change
**No.**

### Risks
1. Double-seek if both `onReady` and `useEffect` fire with the same value — harmless (seeking to same position).
2. The `useMemo` for `renderPlayer` captures `initialSeekSeconds` in its dependency array, so the player JSX re-evaluates when the value changes — this is already correct.

