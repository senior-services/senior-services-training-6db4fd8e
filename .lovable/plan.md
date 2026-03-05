

## Resume Video from Last Position

### Problem
When a user closes and reopens a training video, it starts from the beginning instead of resuming from where they left off.

### Changes

**1. Database migration** — Add `last_position_seconds` column to `video_progress`:
```sql
ALTER TABLE video_progress ADD COLUMN last_position_seconds integer DEFAULT 0;
```

**2. Update RPC function** `update_video_progress_by_email` — Add `p_last_position_seconds` parameter. Store it directly (no GREATEST guard — we want the actual last position):
```sql
last_position_seconds = COALESCE(EXCLUDED.last_position_seconds, video_progress.last_position_seconds)
```

**3. `src/services/api.ts`**
- `updateByEmail`: Add `lastPositionSeconds` parameter, pass as `p_last_position_seconds` to RPC
- `getByEmailAndVideo`: Add `last_position_seconds` to the select query and return type

**4. `src/hooks/useVideoProgress.ts`**
- Track `lastPositionSeconds` state and ref
- `loadExistingProgress`: Restore `last_position_seconds` from DB and return it
- `updateProgressToDatabase`: Send `lastPositionRef.current` alongside other fields
- Expose `updateLastPosition(seconds)` callback that updates the ref (called from VideoPlayer on each tick)
- Expose `lastPositionSeconds` in return value

**5. `src/components/video/VideoPlayer.tsx`**
- Add `initialSeekSeconds` prop
- Add `onLastPositionUpdate` prop
- YouTube: In `onReady`, call `e.target.seekTo(initialSeekSeconds, true)` if > 0
- YouTube polling: Call `onLastPositionUpdate(current)` on each tick
- HTML5: Set `videoEl.currentTime = initialSeekSeconds` on `loadedmetadata`; call `onLastPositionUpdate` on `timeupdate`

**6. `src/components/content/ContentPlayer.tsx`** — Pass through `initialSeekSeconds` and `onLastPositionUpdate`

**7. `src/components/VideoPlayerFullscreen.tsx`** — After `loadExistingProgress`, store the returned `lastPositionSeconds` and pass it as `initialSeekSeconds` to `ContentPlayer`

### Files Changed

| File | Change |
|------|--------|
| DB migration | Add `last_position_seconds` column; update RPC function |
| `src/services/api.ts` | Add param to `updateByEmail`; add field to `getByEmailAndVideo` |
| `src/hooks/useVideoProgress.ts` | Track and persist last position; expose in return |
| `src/components/video/VideoPlayer.tsx` | Accept `initialSeekSeconds` + `onLastPositionUpdate`; seek on load |
| `src/components/content/ContentPlayer.tsx` | Pass through new props |
| `src/components/VideoPlayerFullscreen.tsx` | Wire last position from hook through to player |

### Database Change
**Yes** — New column `last_position_seconds` on `video_progress` and updated RPC function signature.

