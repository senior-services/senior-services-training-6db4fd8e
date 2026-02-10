

## Sort Completed Courses by Most Recently Completed

### What Changes
In the Employee Dashboard, the "Completed Courses" section will display trainings sorted by most recently completed first (newest completion date in the top-left position of the grid).

### Change (1 file)

**File: `src/pages/EmployeeDashboard.tsx`** (around line 317)

After filtering completed videos, add a sort that orders them by `completedAt` in descending order (most recent first). Trainings without a `completedAt` date fall to the end.

Current code:
```
const completedVideos = allRequiredVideos.filter((video) => video.progress >= 100);
```

Updated code:
```
const completedVideos = allRequiredVideos
  .filter((video) => video.progress >= 100)
  .sort((a, b) => {
    if (!a.completedAt && !b.completedAt) return 0;
    if (!a.completedAt) return 1;
    if (!b.completedAt) return -1;
    return new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime();
  });
```

### Review
- **Top 5 Risks**: (1) Some completed trainings may lack a `completedAt` timestamp if completed via legacy flow -- handled by pushing them to the end. (2) No risk to other views since this array is only used in the completed section. (3) No impact on required/incomplete ordering. (4) No performance concern -- small array, simple sort. (5) No accessibility impact.
- **Top 5 Fixes**: (1) Add descending date sort on `completedVideos`. (2) Handle null/undefined `completedAt` gracefully. (3-5) N/A -- single, minimal change.
- **Database Change Required**: No
- **Go/No-Go**: Go
