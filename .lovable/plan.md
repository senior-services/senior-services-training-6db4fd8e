

## Fix Tab Badge Without Squishing It

### Problem
The `-my-1` negative margin is visually squishing the badge, making it look compressed. But without it, the badge stretches the tab trigger taller than "Details".

### Solution
Remove all height hacks from the badge (`py-0 leading-none -my-1`) and instead position it so it doesn't affect the trigger's height calculation. The approach: make the badge `absolute` within the trigger (which is already `relative`) so it floats alongside the text without influencing the trigger's height.

### Changes

**File: `src/components/EditVideoModal.tsx`** (line ~991-993)

Wrap the badge in a relatively-positioned span and use absolute positioning on the badge:

```tsx
<TabsTrigger value="quiz" className="gap-2">
  Quiz
  {quiz && questions.length > 0 && (
    <span className="relative">
      <Badge variant="soft-tertiary" showIcon className="absolute left-0 top-1/2 -translate-y-1/2">
        {questions.length}
      </Badge>
      {/* Invisible spacer to reserve horizontal width */}
      <Badge variant="soft-tertiary" showIcon className="invisible">
        {questions.length}
      </Badge>
    </span>
  )}
</TabsTrigger>
```

This keeps the badge at its natural size, reserves horizontal space with an invisible duplicate, and uses absolute positioning to remove it from the vertical flow.

### Why This Works
- Badge keeps its full natural height and appearance -- no squishing
- The invisible spacer reserves the correct horizontal width so layout doesn't collapse
- Absolute positioning removes the badge from vertical flow, so the trigger height matches "Details"
- Both tabs align flush with the underline

### Review

- **Top 5 Risks**: (1) Slightly more DOM elements (invisible spacer), but negligible. No other risks.
- **Top 5 Fixes**: (1) Remove all badge height hacks. (2) Use absolute positioning pattern to decouple badge from trigger height.
- **Database Change Required**: No
- **Go/No-Go**: Go -- preserves badge appearance while fixing alignment.
