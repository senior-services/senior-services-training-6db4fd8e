

## Fix: Dynamic Seek Buffer Based on Playback Speed

### Problem
The anti-skip buffer is hardcoded to 2 seconds (YouTube) and 1 second (HTML5). At faster playback speeds (1.5x, 2x), the video naturally advances faster than the buffer allows, causing false snap-backs.

### Fix
Replace each hardcoded buffer with `playbackRate * 2`, reading the rate from the player at check time.

### Changes — `src/components/video/VideoPlayer.tsx`

| Location | Current | New |
|----------|---------|-----|
| **Line 146** (YouTube polling) | `current > furthestRef.current + 2` | `current > furthestRef.current + (playbackRate * 2)` — get `playbackRate` via `e.target.getPlaybackRate()` (YouTube IFrame API method) |
| **Line 60** (HTML5 `timeupdate`) | `videoEl.currentTime <= furthestRef.current + 1` | `videoEl.currentTime <= furthestRef.current + (videoEl.playbackRate * 2)` |
| **Line 75** (HTML5 `seeking`) | `videoEl.currentTime > furthestRef.current + 1` | `videoEl.currentTime > furthestRef.current + (videoEl.playbackRate * 2)` |

No other files or database changes needed.

