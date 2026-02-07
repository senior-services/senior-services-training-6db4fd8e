

# Push Action Buttons to Bottom of Training Cards

## What changes

When training cards have different title lengths or descriptions, the action buttons ("Start Training", "Continue Training", "Review Training") should always sit at the bottom of the card, keeping all cards in a row visually aligned.

## How

A single class addition on the `CardFooter` elements in `src/components/TrainingCard.tsx`:

- **Line 326** (completed footer): add `mt-auto` to the existing classes
- **Line 346** (non-completed footer): add `mt-auto` to the existing classes

The card already uses `h-full flex flex-col`, so adding `mt-auto` to the footer pushes it down to fill any remaining space.

| Item | Detail |
|---|---|
| Files changed | 1 |
| Lines changed | 2 |
| Risk | Very low -- one utility class addition per footer |

