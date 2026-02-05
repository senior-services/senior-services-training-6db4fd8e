
# Plan: Update Date Added Column Text Color

## Changes

Two simple text color updates to use primary text instead of muted text.

| File | Line | Change |
|------|------|--------|
| `src/components/dashboard/VideoTable.tsx` | 263 | Change `text-muted-foreground` to `text-foreground` |
| `src/components/dashboard/AdminManagement.tsx` | 265 | Change `text-muted-foreground` to `text-foreground` |

## Before → After

**Trainings View (VideoTable.tsx line 263)**
```jsx
// Before
<span className="text-sm text-muted-foreground">

// After
<span className="text-sm text-foreground">
```

**Admins View (AdminManagement.tsx line 265)**
```jsx
// Before
<TableCell className="text-muted-foreground">

// After
<TableCell className="text-foreground">
```

## Result

Date Added columns in both Trainings and Admins views will display in the primary text color, matching other important data columns.
