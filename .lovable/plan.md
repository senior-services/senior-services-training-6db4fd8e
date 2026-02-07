

# Revised Plan: Update TrainingCard Layout

## Overview

Four visual updates to the TrainingCard, with all review conditions addressed.

---

## Changes

### 1. Badge: move above title, switch to soft variants

The status badge moves from the thumbnail overlay to above the course title. Styling changes from solid to soft variants.

**Variant mapping:**
- `success` becomes `soft-success`
- `destructive` becomes `soft-destructive`
- `warning` becomes `soft-warning`
- `secondary` becomes `soft-secondary`

### 2. Button: outline style, not full width

The "Start Training" / "Continue Training" button changes from a filled full-width button to an outline style with natural width.

### 3. Completed cards: show date + quiz in footer, keep "Review Training" button

When training is complete, the card bottom shows:
- Completion date with a `CheckCircle` icon
- Quiz results with a `ClipboardList` icon (if quiz data exists)
- A "Review Training" outline button remains visible for easy re-access

### 4. Wire `completedAt` data through

The dashboard already calculates `effectiveCompletedAt` from `assignment.completed_at` (confirmed in EmployeeDashboard.tsx line 249). It just needs to be passed into the TrainingVideo object.

---

## Technical Details

### File 1: `src/components/TrainingCard.tsx`

**A. Interface (line 28-49):** Add `completedAt?: string` to `TrainingVideo`.

**B. BadgeConfig type (line 64-69):** Update variant type to include soft variants:
```
variant: 'success' | 'destructive' | 'warning' | 'secondary' | 'default' | 'tertiary'
       | 'soft-success' | 'soft-destructive' | 'soft-warning' | 'soft-secondary';
```

**C. Imports (line 11):** Add `ClipboardList` to the lucide-react import.

**D. Due date variants (lines 143-211):** Change all variant values from solid to soft:
- `'success'` to `'soft-success'`
- `'destructive'` to `'soft-destructive'`
- `'warning'` to `'soft-warning'`
- `'secondary'` to `'soft-secondary'`

**E. Remove badge from thumbnail (lines 284-296):** Delete both badge blocks (the `dueDateInfo` badge and the standalone "Completed" badge) from inside the `<header>` element.

**F. Add badge above title (line 308):** Insert the badge as the first element inside `<CardHeader>`, before the title div. Same conditional logic, same `showIcon` behavior, no absolute positioning. Also handle the no-due-date completed case with a standalone soft-success badge.

**G. Remove old quiz badge block (lines 319-333):** Delete the existing quiz results badge from CardHeader entirely. This data moves to the footer to avoid duplication.

**H. Replace completed card footer (lines 337-345):** Change the completed branch from an empty spacer to:
- A `CardFooter` with two rows:
  - Row 1: `CheckCircle` icon + formatted completion date (e.g., "Jan 6, 2025") on the left, and `ClipboardList` icon + quiz score on the right (if quiz data exists)
  - Row 2: An outline "Review Training" button
- The non-completed branch also changes to use `variant="outline"` and removes `w-full`.

**I. Button for all states (lines 337-345):** Both completed and non-completed cards get an outline button. Completed cards show "Review Training", in-progress shows "Continue Training", not-started shows "Start Training". All use `variant="outline"` without `w-full`.

### File 2: `src/pages/EmployeeDashboard.tsx`

**Line 285 (inside return object):** Add `completedAt: effectiveCompletedAt || undefined` to the returned object in `transformToTrainingVideo`. The value is already correctly derived from `assignment?.completed_at` (line 249), with quiz-aware logic that nullifies it when quiz is still pending (line 258).

### File 3: `src/pages/ComponentsGallery.tsx`

- Add `completedAt` to the completed card example
- Update the Badge Rules Reference table to say "above the title" and list soft variants
- Ensure all four card states are represented

---

## Review Conditions -- All Addressed

| Condition | Resolution |
|---|---|
| Fix BadgeConfig type | Adding all soft variants to the union type prevents build errors |
| Confirm completedAt data source | Verified: derived from `assignment.completed_at` (line 249), nullified when quiz pending (line 258) |
| Remove duplicate quiz badge | Old quiz badge block (lines 319-333) is explicitly deleted; quiz info appears only in the footer |
| Keep Review Training button | Completed cards retain an outline "Review Training" button below the completion details |

---

## Summary

| Item | Detail |
|---|---|
| Files changed | 3 (`TrainingCard.tsx`, `EmployeeDashboard.tsx`, `ComponentsGallery.tsx`) |
| New imports | `ClipboardList` from lucide-react |
| Interface change | Add `completedAt?: string` to `TrainingVideo` |
| Type fix | Expand `BadgeConfig.variant` to include soft variants |
| Data pass-through | Wire existing `effectiveCompletedAt` into TrainingVideo |
| Database changes | None |
| New dependencies | None |

