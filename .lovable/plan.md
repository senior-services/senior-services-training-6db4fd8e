
## Fix: Timer Duration Not Saved to Database

### Problem
The viewing timer value entered in the Add Content form is never persisted. Both `createVideoOnly` and `handleConfirmAssignment` in `VideoManagement.tsx` omit `duration_seconds` from the data passed to the API. The API's `create` method also doesn't include it in the Supabase insert. Result: all presentations have `duration_seconds: 0`, so the timer always falls back to 60 seconds regardless of what the admin entered.

The Badge-based timer display (attention/success variants) is already correctly implemented from the prior refactor -- this fix is purely about the data pipeline.

### Root Cause (3 gaps)

```text
AddContentModal          VideoManagement           api.ts (create)
------------------       -----------------         ----------------
duration_seconds: 90  -> sanitizedData: {         -> insert({
                           title, url,                 title, url,
                           content_type             content_type,
                           // MISSING!                 // MISSING!
                         }                           })
```

### Fix (3 lines across 2 files)

**File 1: `src/components/dashboard/VideoManagement.tsx`**

- `createVideoOnly` (line 179): Add `duration_seconds: contentData.duration_seconds || 0` to `sanitizedData`
- `handleConfirmAssignment` (line 215): Same addition to that function's `sanitizedData`

**File 2: `src/services/api.ts`**

- `create` method (line 207): Add `duration_seconds: videoData.duration_seconds || 0` to the Supabase `.insert()` call

### What Already Works (no changes needed)

- AddContentModal correctly passes `duration_seconds` in form data
- VideoPlayerFullscreen correctly reads `video.duration_seconds` for the countdown
- Badge styling (soft-attention with Clock while active, soft-success with checkmark when complete) is already in place
- Fallback to 60s when value is missing or below 60

### Existing Data

The two existing presentation records have `duration_seconds: 0`. After this fix, newly created presentations will save correctly. Existing ones will continue using the 60s fallback, which is the intended safe default.

### Review

- **Top 3 Risks:** (1) Existing records keep 60s fallback -- acceptable. (2) None structural. (3) None.
- **Top 3 Fixes:** (1) Timer now actually persists admin-configured duration. (2) Minimal change surface. (3) No schema changes needed.
- **Database Change:** No
- **Verdict:** Go
