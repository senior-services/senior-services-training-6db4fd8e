

## Fix: Race Condition in Download Data Export

### Root Cause

`exportToExcel` reads from three pieces of React state: `people`, `employeeVideos`, and `employeeQuizzes`. However, `loadPeople` updates these **sequentially** — it calls `setPeople(transformed)` first (line 133), then fetches quiz data per-person in a loop, and only sets `setEmployeeVideos` and `setEmployeeQuizzes` at the very end (lines 183-184). 

When a real-time event (postgres_changes) triggers `loadPeople` while the user clicks Download, or if the user clicks Download before the initial load completes, the export captures a state where `people` is populated but `employeeVideos`/`employeeQuizzes` are empty or stale — resulting in rows showing "No assignments."

### Fix

Make `exportToExcel` **self-contained** — it should fetch its own fresh data directly from the API instead of relying on component state. This mirrors the pattern already used by `loadHiddenPeopleQuizData`.

### Changes in `src/components/dashboard/PeopleManagement.tsx`

**1. Create a new helper function `loadFreshPeopleData`** that:
- Calls `employeeOperations.getAll()` to get fresh people data
- Fetches quiz metadata and quiz attempts (same logic as `loadPeople` lines 136-184)
- Returns `{ people, videos, quizzes }` as a resolved value rather than setting state

**2. Refactor `exportToExcel`** (lines 501-565):
- Replace reading from `people`/`employeeVideos`/`employeeQuizzes` state with a call to `loadFreshPeopleData()`
- For hidden data, keep the existing `loadHiddenPeopleQuizData()` call
- Remove `people`, `employeeVideos`, `employeeQuizzes` from the `useCallback` dependency array (they are no longer read)

**3. The existing `loadPeople` and state variables remain unchanged** — they still power the table UI. The export pipeline simply gets its own independent data fetch.

### Pseudocode

```typescript
const loadFreshPeopleData = useCallback(async () => {
  const data = await employeeOperations.getAll();
  // ... same transform + quiz fetch logic as loadPeople ...
  return { people: transformed, videos: videoMap, quizzes: quizMap };
}, []);

const exportToExcel = useCallback(async (includeHidden: boolean) => {
  setIsExporting(true);
  try {
    // Fresh fetch — no race condition
    const freshData = await loadFreshPeopleData();
    let allPeople = freshData.people;
    let allVideos = freshData.videos;
    let allQuizzes = freshData.quizzes;

    if (includeHidden && hiddenPeople.length > 0) {
      // hiddenPeople list is fine to read from state (just IDs/names)
      // but quiz data is fetched fresh via loadHiddenPeopleQuizData
      const hiddenData = await loadHiddenPeopleQuizData();
      // ... merge as before ...
    }
    // ... rest of export logic unchanged ...
  }
}, [hiddenPeople, loadFreshPeopleData, loadHiddenPeopleQuizData, ...]);
```

### Files Changed

| File | Change |
|------|--------|
| `src/components/dashboard/PeopleManagement.tsx` | Extract `loadFreshPeopleData` helper; refactor `exportToExcel` to fetch fresh data instead of reading state |

No database or CSS changes needed.

### Risk Assessment

1. **Race condition on export** (Critical) — Fixed by making export self-contained.
2. **Hidden people list from state** (Low) — `hiddenPeople` is only used for ID set and merging; its staleness would only affect the hidden/active label, not data completeness. Acceptable.
3. **Duplicate fetch logic** (Low) — The transform + quiz logic is duplicated from `loadPeople`, but this is intentional separation of concerns (UI state vs. export pipeline).

