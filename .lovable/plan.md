

## Add `rel=0` to YouTube Player Parameters

### Problem
The iframe `src` URL already includes `rel=0`, but when the YouTube IFrame API's `YT.Player` constructor takes over the iframe (line 158), it does not pass `playerVars`. The API may override the original URL parameters, causing the "More videos" panel to appear when a video ends.

### Fix — `src/components/video/VideoPlayer.tsx`

**Line 158**: Add `playerVars` to the `YT.Player` constructor:

```typescript
ytPlayerRef.current = new YTGlobal.Player(`yt-player-${id}`, {
  playerVars: {
    rel: 0,
    enablejsapi: 1,
    origin: window.location.origin,
    loop: 0,
  },
  events: {
    // ... existing event handlers unchanged
```

This ensures `rel=0` is respected by the IFrame API regardless of what was in the original `src` URL.

### Database Change
**No.**

### Files Changed
| File | Change |
|------|--------|
| `src/components/video/VideoPlayer.tsx` | Add `playerVars` with `rel: 0` to `YT.Player` constructor |

