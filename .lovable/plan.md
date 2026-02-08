

## Fix Training Card Spacing

Two changes to resolve the horizontally squished cards on the published site:

### 1. Remove `xl:grid-cols-5` from EmployeeDashboard.tsx
Remove the `xl:grid-cols-5` class from all three grid containers (lines 558, 577, and 613). The grid will max out at `lg:grid-cols-4`, giving cards more breathing room on wide screens.

### 2. Remove `min-w-[280px]` from TrainingCard.tsx
Remove the `min-w-[280px]` class from the article element (line 262). This minimum width conflicts with the CSS grid -- when the grid assigns columns narrower than 280px, the min-width forces cards to overflow or compress unpredictably.

### Files Changed
- **src/pages/EmployeeDashboard.tsx** (lines 558, 577, 613) -- change `lg:grid-cols-4 xl:grid-cols-5` to `lg:grid-cols-4`
- **src/components/TrainingCard.tsx** (line 262) -- remove `min-w-[280px]` from the article className

