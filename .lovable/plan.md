

## Add Quiz Results Column to Assign Videos Modal

### Overview
Add a "Quiz Results" column to the Assign Videos dialog table, matching the existing pattern from EmployeeManagement.tsx. This shows whether a video has a quiz and the employee's quiz score if completed.

---

### Changes Required

**File: `src/components/dashboard/AssignVideosModal.tsx`**

---

### 1. Add Import for quizOperations

**Line 43** - Add quizOperations import alongside existing imports:

```tsx
import { videoOperations, assignmentOperations, progressOperations } from '@/services/api';
import { quizOperations } from '@/services/quizService';
```

---

### 2. Add Two New State Variables

**After line 99** (after `filterMode` state) - Add state for quiz data:

```tsx
const [videoIdsWithQuizzes, setVideoIdsWithQuizzes] = useState<Set<string>>(new Set());
const [employeeQuizResults, setEmployeeQuizResults] = useState<Map<string, { score: number; total_questions: number; completed_at: string }>>(new Map());
```

**Why:** 
- `videoIdsWithQuizzes` tracks which videos have quizzes
- `employeeQuizResults` stores the employee's quiz attempt results

---

### 3. Update Promise.all to Include Quiz Data Fetching

**Lines 125-129** - Expand the parallel data loading to include quizzes and user attempts:

```tsx
const [videosResult, assignmentsResult, progressResult, quizzesResult, userAttemptsResult] = await Promise.all([
  videoOperations.getAll(true),
  employee ? assignmentOperations.getByEmployee(employee.id) : Promise.resolve({ success: true, data: [] as VideoAssignment[], error: null }),
  employee ? progressOperations.getByEmployee(employee.id) : Promise.resolve({ success: true, data: [], error: null }),
  supabase.from('quizzes').select('video_id'),
  employee?.email ? quizOperations.getUserAttempts(employee.email).catch(err => {
    logger.warn('Failed to load quiz attempts:', err);
    return [];
  }) : Promise.resolve([])
]);
```

**Why:** All data loads in parallel for best performance (addresses the performance concern from review).

---

### 4. Process Quiz Data After Progress Data

**After line 163** (after `setVideoProgressData(progressMap);`) - Add quiz data processing:

```tsx
// Process quiz data to find which videos have quizzes
if (quizzesResult.data) {
  const quizVideoIds = new Set<string>(quizzesResult.data.map(quiz => quiz.video_id));
  setVideoIdsWithQuizzes(quizVideoIds);
} else {
  setVideoIdsWithQuizzes(new Set());
}

// Process employee quiz attempts - keep most recent per video
const quizResultsMap = new Map<string, { score: number; total_questions: number; completed_at: string }>();
if (userAttemptsResult && Array.isArray(userAttemptsResult)) {
  for (const attempt of userAttemptsResult) {
    if (attempt.quiz?.video_id) {
      const existingAttempt = quizResultsMap.get(attempt.quiz.video_id);
      const currentAttemptDate = new Date(attempt.completed_at);
      if (!existingAttempt || new Date(existingAttempt.completed_at) < currentAttemptDate) {
        quizResultsMap.set(attempt.quiz.video_id, {
          score: attempt.score,
          total_questions: attempt.total_questions,
          completed_at: attempt.completed_at
        });
      }
    }
  }
}
setEmployeeQuizResults(quizResultsMap);
```

---

### 5. Add State Reset in closeModal Function

**Lines 399-407** - Add quiz state reset to ensure clean state when modal closes:

```tsx
const closeModal = () => {
  setSelectedVideoIds(new Set());
  setVideoDeadlines(new Map(initialVideoDeadlines));
  setShowDiscardDialog(false);
  setShowUnassignDialog(false);
  setFilterMode('unassigned');
  resetDueDateDialog();
  // Reset quiz state
  setVideoIdsWithQuizzes(new Set());
  setEmployeeQuizResults(new Map());
  onOpenChange(false);
};
```

**Why:** Prevents stale quiz data from persisting between different employees (addresses state reset concern from review).

---

### 6. Add getQuizResults Helper Function

**Before line 483** (before `if (!employee) return null;`) - Add helper function:

```tsx
// Get quiz results display for a video
const getQuizResults = (videoId: string): React.ReactNode => {
  const hasQuiz = videoIdsWithQuizzes.has(videoId);
  const quizAttempt = employeeQuizResults.get(videoId);
  
  if (!hasQuiz) {
    return <span className="text-muted-foreground" aria-label="No quiz available">--</span>;
  }
  
  if (!quizAttempt) {
    return <span className="text-muted-foreground">Not Completed</span>;
  }
  
  const percentage = Math.round((quizAttempt.score / quizAttempt.total_questions) * 100);
  return <span>{percentage}% ({quizAttempt.score}/{quizAttempt.total_questions} Correct)</span>;
};
```

**Why:** Matches exact display format from EmployeeManagement.tsx and includes ARIA label for accessibility.

---

### 7. Add Table Header Column

**Line 589** - Add Quiz Results header after Due Date:

```tsx
<TableHead>Due Date</TableHead>
<TableHead>Quiz Results</TableHead>
```

---

### 8. Add Table Body Cell

**After line 650** (after the Due Date TableCell closing tag) - Add Quiz Results cell:

```tsx
<TableCell>
  <span className="text-sm">
    {getQuizResults(video.id)}
  </span>
</TableCell>
```

---

### Summary

| Change | Location | Purpose |
|--------|----------|---------|
| Import quizOperations | Line 43 | Access quiz service functions |
| New state variables | After line 99 | Store quiz data |
| Parallel data fetching | Lines 125-129 | Load quiz data efficiently |
| Process quiz results | After line 163 | Parse quiz attempts |
| State reset | Lines 399-407 | Clear state on modal close |
| getQuizResults helper | Before line 483 | Format quiz display |
| Table header | Line 589 | Add column header |
| Table cell | After line 650 | Display quiz results |

**Total: ~45-50 lines of new code**

---

### Technical Notes

- All quiz data loads in parallel with existing data (no performance penalty)
- Quiz state resets when modal closes (prevents stale data)
- Uses existing `quizOperations.getUserAttempts()` from quizService.ts
- Matches exact display format from EmployeeManagement.tsx
- Error handling gracefully degrades if quiz data fails to load
- Includes ARIA label for accessibility on empty state

