

## Bug: Training Incorrectly Marked Complete on Video End

### Root Cause

In `handleVideoEnded` (VideoPlayerFullscreen.tsx, line 331), non-quiz videos send `updateProgress(100)`:

```typescript
const finalProgress = quiz ? 99 : 100;
```

This writes `progress_percent = 100` to the database (without `completed_at`). When the dashboard refreshes, multiple components treat `progress_percent === 100` as "completed":

- **EmployeeDashboard.tsx** line 255: `assignment?.completed_at || assignment?.progress_percent === 100`
- **PeopleManagement.tsx** lines 317, 448: `assignment.progress_percent === 100 || assignment.completed_at`
- **AssignVideosModal.tsx** line 227: `progress.progress_percent === 100 || progress.completed_at`
- **api.ts** lines 424, 543: `a.progress_percent === 100`

Per the project's own architecture rule: *"Training completion status is strictly governed by the presence of a `completed_at` timestamp."* The `progress_percent === 100` fallback contradicts this.

### Fix (Two-Pronged)

**1. `src/components/VideoPlayerFullscreen.tsx` -- Cap video-end progress at 99**

Line 331: Change `const finalProgress = quiz ? 99 : 100;` to:
```typescript
const finalProgress = 99;
```

This ensures `progress_percent` never reaches 100 from just watching. Only `markComplete()` (triggered by the "Complete Training" button or quiz submission) writes 100.

**2. Remove `progress_percent === 100` as a completion signal from all files**

These changes enforce the `completed_at`-only rule:

- **`src/pages/EmployeeDashboard.tsx`** line 255:
  `const videoMarkedComplete = !!assignment?.completed_at;`

- **`src/components/dashboard/PeopleManagement.tsx`** lines 317, 448:
  `const videoCompleted = !!assignment.completed_at;`

- **`src/components/dashboard/AssignVideosModal.tsx`** line 227:
  `const videoCompleted = !!progress.completed_at;`

- **`src/services/api.ts`** lines 424, 543:
  `a.completed_at != null` instead of `a.progress_percent === 100`

### Why Both Fixes

Fix 1 alone prevents the bug going forward. Fix 2 hardens the system against any edge case where `progress_percent` could reach 100 without explicit completion (e.g., stale data, manual DB edits). Together they enforce the documented architecture rule.

### Files Changed

| File | Change |
|------|--------|
| `VideoPlayerFullscreen.tsx` | Cap `handleVideoEnded` at 99 for all content |
| `EmployeeDashboard.tsx` | Use `completed_at` only |
| `PeopleManagement.tsx` | Use `completed_at` only (2 locations) |
| `AssignVideosModal.tsx` | Use `completed_at` only |
| `api.ts` | Use `completed_at` only (2 locations) |

### No Database Change

No schema or data migration needed. The `useVideoProgress` hook already correctly requires `forceComplete === true` to set `completed_at`.

### Review
1. **Top 3 Risks**: (a) Existing rows with `progress_percent = 100` but no `completed_at` will now show as incomplete -- this is correct behavior per the architecture rule. (b) Progress bar will show 99% after finishing a video instead of 100% until attestation -- acceptable since the UI already prompts for attestation at that point. (c) None.
2. **Top 3 Fixes**: (a) Prevents false completion on dialog close. (b) Enforces `completed_at`-only completion rule system-wide. (c) Aligns all dashboards to consistent logic.
3. **Database Change**: No.
4. **Verdict**: Go.

