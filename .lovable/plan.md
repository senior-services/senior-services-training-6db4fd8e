
## Remove `text-caption` Overrides from Toggle Items in AssignVideosModal

### Problem
`AssignVideosModal.tsx` applies `text-caption` (13px) directly on each `ToggleGroupItem`, overriding the master template's `text-body` (16px). This violates the 16px senior legibility minimum for interactive elements.

### Change

**`src/components/dashboard/AssignVideosModal.tsx` (lines 678, 685, 692, 697)** -- Remove `text-caption` from all four toggle items:

```tsx
// Before (repeated 4x)
className="text-caption px-3 py-1"

// After
className="px-3 py-1"
```

The toggle items will inherit `text-body` from the `.button-toggle` master template, meeting the 16px legibility standard.

### Review
1. **Top 3 Risks:** (a) Toggle items will be slightly larger -- acceptable and intended. (b) No layout breakage expected since the toggle group uses flex. (c) No other files affected.
2. **Top 3 Fixes:** (a) All toggle text meets 16px minimum. (b) Removes prohibited raw size overrides on primitives. (c) Master template controls typography as intended.
3. **Database Change:** No.
4. **Verdict:** Go -- four identical one-word deletions in a single file.
