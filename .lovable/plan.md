

## Fix Attestation Checkbox Alignment in Dialog Footer

### Change (1 file)

**File: `src/components/VideoPlayerFullscreen.tsx`** (line 575)

Change:
```tsx
<DialogFooter className="flex-row justify-between items-center">
```
To:
```tsx
<DialogFooter className="flex-row sm:justify-between items-center">
```

This adds the `sm:` prefix to `justify-between` so it overrides the `DialogFooter` base class `sm:justify-end`, pushing the attestation checkbox to the left and action buttons to the right.

- **Database Change Required**: No
- **Go/No-Go**: Go

