

## Fix Text Color Consistency in AssignVideosModal Table

### Problem
Looking at the screenshot, text colors are inconsistent across the table:
- Some course titles appear dimmed (completed ones)
- "N/A", "--", and "Not Completed" values appear in muted gray
- Actual values like dates and quiz scores appear in normal body color

The user wants **all body text** to use consistent foreground color - whether it's an actual value or a placeholder.

---

### Changes Required

**File: `src/components/dashboard/AssignVideosModal.tsx`**

---

### 1. Course Title - Remove Muted Color for Completed

**Lines 675-678** - Remove the conditional muted styling:

**Current:**
```tsx
<span className={cn(
  "font-medium text-sm",
  isCompleted && "text-muted-foreground"
)}>
  {video.title}
</span>
```

**Updated:**
```tsx
<span className="font-medium text-sm">
  {video.title}
</span>
```

---

### 2. Due Date - Always Use Body Color

**Lines 702-708** - Remove conditional muted styling:

**Current:**
```tsx
<span className={cn(
  "text-sm",
  !videoDeadlines.get(video.id) && "text-muted-foreground"
)}>
  {formatDueDate(video.id)}
</span>
```

**Updated:**
```tsx
<span className="text-sm">
  {formatDueDate(video.id)}
</span>
```

---

### 3. Quiz Results - Remove Muted Color from Helper Function

**Lines 526-531** - Update the `getQuizResults` helper:

**Current:**
```tsx
if (!hasQuiz) {
  return <span className="text-muted-foreground" aria-label="No quiz available">--</span>;
}

if (!quizAttempt) {
  return <span className="text-muted-foreground">Not Completed</span>;
}
```

**Updated:**
```tsx
if (!hasQuiz) {
  return <span aria-label="No quiz available">--</span>;
}

if (!quizAttempt) {
  return <span>Not Completed</span>;
}
```

---

### Summary

| Location | Change |
|----------|--------|
| Lines 675-678 | Remove `isCompleted && "text-muted-foreground"` from course title |
| Lines 702-708 | Simplify to `className="text-sm"` for due date |
| Lines 527, 531 | Remove `className="text-muted-foreground"` from quiz results placeholders |

**Result:** All body text in the table will display in consistent foreground color, regardless of whether it's an actual value or placeholder.

