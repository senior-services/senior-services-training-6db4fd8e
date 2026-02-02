

## Fix UI Completion Logic to Match Download Export

### Overview
The UI in AssignVideosModal incorrectly marks videos as "Completed" based only on video progress, ignoring quiz completion. The download export already has the correct logic. This fix aligns the UI with the business rule.

---

### Business Rule (Confirmed)
- **With quiz**: Completed = video watched to 100% AND quiz finished
- **Without quiz**: Completed = video watched to 100%

---

### What's Being Fixed

The UI currently marks Jane Doe's "Time Management" video as "Completed" even though she hasn't finished the required quiz. The download correctly shows it as pending.

---

### Technical Changes

**File: `src/components/dashboard/AssignVideosModal.tsx`**

**Change 1: Remove premature completion determination (Lines 153-171)**

Replace this code that sets completedVideoIds based only on video progress:
```tsx
// Process progress data to find completed videos and store progress info
if (progressResult.success && progressResult.data) {
  const completed = new Set<string>();
  const progressMap = new Map<string, { progress_percent: number; completed_at: string | null }>();
  
  progressResult.data.forEach(progress => {
    progressMap.set(progress.video_id, {
      progress_percent: progress.progress_percent,
      completed_at: progress.completed_at
    });
    
    if (progress.progress_percent === 100 || progress.completed_at) {
      completed.add(progress.video_id);
    }
  });
  
  setCompletedVideoIds(completed);
  setVideoProgressData(progressMap);
}
```

With code that only stores progress data (completion determined later):
```tsx
// Process progress data and store progress info (completion determined after quiz data is loaded)
const progressMap = new Map<string, { progress_percent: number; completed_at: string | null }>();
if (progressResult.success && progressResult.data) {
  progressResult.data.forEach(progress => {
    progressMap.set(progress.video_id, {
      progress_percent: progress.progress_percent,
      completed_at: progress.completed_at
    });
  });
  setVideoProgressData(progressMap);
}
```

**Change 2: Add completion determination after quiz data is loaded (After line 198)**

After `setEmployeeQuizResults(quizResultsMap);`, add logic to determine completed videos using both progress and quiz data:
```tsx
// Determine completed videos with full context (video progress + quiz completion)
const quizVideoIds = new Set<string>(quizzesResult.data?.map(quiz => quiz.video_id) || []);
const completed = new Set<string>();

progressMap.forEach((progress, videoId) => {
  const videoCompleted = progress.progress_percent === 100 || progress.completed_at;
  
  if (quizVideoIds.has(videoId)) {
    // Video has quiz - require both video AND quiz completion
    if (videoCompleted && quizResultsMap.has(videoId)) {
      completed.add(videoId);
    }
  } else {
    // No quiz - video completion is enough
    if (videoCompleted) {
      completed.add(videoId);
    }
  }
});
setCompletedVideoIds(completed);
```

---

### Result After Fix

| Jane Doe's "Time Management" Video | Before | After |
|-----------------------------------|--------|-------|
| **Screen display** | Completed | Pending |
| **Download file** | Pending | Pending |

Both will now correctly show she hasn't completed the training because the quiz isn't done.

---

### Why This Works

1. **Uses existing data** - Quiz data (`quizResultsMap`) is already loaded, just not used for completion
2. **Matches download logic** - Same rules as `EmployeeManagement.tsx` export function
3. **Minimal change** - Only moves where completion is calculated, doesn't add new queries
4. **Business rule enforced** - Employees must complete both video AND quiz (when applicable)

