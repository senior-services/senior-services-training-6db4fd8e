

## Fix Quiz Version Display in Assign Videos Dialog

### Problems (from screenshot)
1. **Unassigned videos with quizzes** (e.g., PPSX, PPTX) show a version number like "1" instead of "--". Unassigned videos should always show "--" regardless of whether the course has a quiz.
2. **Completed videos with quiz attempts** (e.g., Anti-Harassment 67%, Paid Time Off 100%) show "N/A" instead of the actual version number. If there is a quiz and the employee has taken it, the version should always display.

### Root Cause
In `getQuizVersion` (line 641 of `AssignVideosModal.tsx`):
- The `isAssigned` check only runs inside the `!hasQuiz` branch, so unassigned videos with quizzes skip it and display a version number.
- The `isLegacyExempt` check runs before checking for an actual quiz attempt, so employees who voluntarily took the quiz still get "N/A".

### Change

**File: `src/components/dashboard/AssignVideosModal.tsx`** (lines 641-653)

Rewrite `getQuizVersion` with corrected priority:

```
const getQuizVersion = (videoId: string): string => {
  const hasQuiz = videoIdsWithQuizzes.has(videoId);
  const isAssigned = assignedVideoIds.has(videoId) || selectedVideoIds.has(videoId);

  // Unassigned videos always show "--"
  if (!isAssigned) {
    return "--";
  }
  // No quiz on the course: show "N/A"
  if (!hasQuiz) {
    return "N/A";
  }
  // If employee has a quiz attempt, always show the version
  const quizAttempt = employeeQuizResults.get(videoId);
  if (quizAttempt) {
    const version = videoQuizVersions.get(videoId);
    return version !== undefined ? `${version}` : "--";
  }
  // Legacy-exempt (no attempt): show "N/A"
  if (isLegacyExempt(videoId)) {
    return "N/A";
  }
  // Assigned, has quiz, not exempt: show version
  const version = videoQuizVersions.get(videoId);
  return version !== undefined ? `${version}` : "--";
};
```

### Review
- **Top 5 Risks**: (1) None significant -- reuses existing data sources already loaded in the component.
- **Top 5 Fixes**: (1) Move unassigned check to the top. (2) Check quiz attempts before legacy exemption. (3) Keep "N/A" only for no-quiz or exempt-without-attempt cases.
- **Database Change Required**: No
- **Go/No-Go**: Go

