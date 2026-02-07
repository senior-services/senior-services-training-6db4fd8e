

# Set Minimum Width on Training Cards

## What changes

Each training card will have a minimum width of 280px, preventing cards from becoming too narrow on smaller layouts or when many cards appear in a row.

## How

A single class addition on the outer wrapper `div` in `src/components/TrainingCard.tsx`.

**Line ~281** -- Add `min-w-[280px]` to the existing classes on the card's outermost `<div>`:

```tsx
<div className="h-full min-w-[280px]">
```

| Item | Detail |
|---|---|
| Files changed | 1 |
| Lines changed | 1 |
| Risk | Very low -- one utility class addition |

