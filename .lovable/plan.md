

## Fix: Use `loadResult` Data Instead of Stale State

### Root Cause

Line 169 reads `const loadedVideo = initialVideo || video;` but after the dialog closes and reopens:
1. `resetVideoData()` sets `video` state to `null`
2. `loadVideoData()` calls `setVideo(newData)` but React hasn't re-rendered yet
3. So `video` is still `null` when line 169 executes
4. If `initialVideo` prop is also `undefined`, `loadedVideo` is `null` and the entire timer-restoration block is skipped silently

### Fix

**File: `src/components/VideoPlayerFullscreen.tsx` -- lines 165-177**

Replace the stale-state reference with the video data already returned by `loadVideoData`:

```tsx
if (user?.email) {
  const existingProgress = await loadExistingProgress();
  
  // Restore timer if presentation time requirement was previously met
  const loadedVideo = loadResult?.data || initialVideo;
  if (loadedVideo?.content_type === 'presentation' && existingProgress?.acknowledgmentViewingSeconds != null) {
    const minSeconds = loadedVideo.duration_seconds && loadedVideo.duration_seconds >= 60
      ? loadedVideo.duration_seconds : 60;
    if (existingProgress.acknowledgmentViewingSeconds >= minSeconds) {
      setViewingSeconds(existingProgress.acknowledgmentViewingSeconds);
      setCheckboxEnabled(true);
    }
  }
}
```

`loadResult` is the resolved value from `loadVideoData` (line 155). Its shape is `{ success: true, data: Video }` on success. Using `loadResult?.data` gives us the freshly-loaded video object without relying on React state timing.

### What changes

- One line: `initialVideo || video` becomes `loadResult?.data || initialVideo`

### Review

1. **Top 3 Risks:** (a) `loadResult` shape -- verified: `withErrorHandler` always returns `{ success, data }`. (b) `initialVideo` fallback still present as safety net. (c) No other consumers affected.
2. **Top 3 Fixes:** (a) Eliminates stale-state race condition. (b) Single-line change. (c) No new dependencies.
3. **Database Change:** No.
4. **Verdict:** Go.

