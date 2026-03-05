

## Add `modestbranding=1` to YouTube Player Parameters

Single-line addition to the existing `playerVars` object.

### Change — `src/components/video/VideoPlayer.tsx`

**Line 163**: Add `modestbranding: 1` after `loop: 0` in the `playerVars` block:

```typescript
playerVars: {
  rel: 0,
  enablejsapi: 1,
  origin: window.location.origin,
  loop: 0,
  modestbranding: 1,
},
```

Also update the iframe `src` URL (if `modestbranding` is not already in the query string) for consistency.

### Database Change
**No.**

### Files Changed
| File | Change |
|------|--------|
| `src/components/video/VideoPlayer.tsx` | Add `modestbranding: 1` to `playerVars` |

