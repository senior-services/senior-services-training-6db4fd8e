

## Remove Question Count Badge from Quiz Tab

### What's changing
Removing the question count badge from the "Quiz" tab label entirely, along with all the extra code that was added to try to fix the spacing issue.

### Changes

**File: `src/components/EditVideoModal.tsx`** (lines 991-999)

Replace the current Quiz tab trigger (with the badge wrapper, absolute positioning, and invisible spacer) with a simple tab trigger:

```tsx
<TabsTrigger value="quiz">
  Quiz
</TabsTrigger>
```

This removes:
- The `gap-2` class on the trigger (no longer needed)
- The conditional badge rendering
- The relative span wrapper
- Both Badge components (absolute-positioned and invisible spacer)

### Review
- **Top 5 Risks**: None -- purely removing code.
- **Top 5 Fixes**: (1) Remove badge and all related wrapper code from Quiz tab.
- **Database Change Required**: No
- **Go/No-Go**: Go -- clean removal, fixes the spacing issue by eliminating its cause.

