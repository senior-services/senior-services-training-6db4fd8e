

## Update Toggle Components to `text-body` Typography

### Problem
The toggle components use `text-body-sm` (~14px) for both the toggle item text and their labels. This falls below the 16px senior legibility minimum for interactive elements.

### Changes

**1. `src/index.css` (line 214)** -- Update the `.button-toggle` base class:

```css
/* Before */
.button-toggle {
  @apply inline-flex items-center justify-center rounded-md text-body-sm

/* After */
.button-toggle {
  @apply inline-flex items-center justify-center rounded-md text-body
```

This is the master template for all toggle items, so the fix propagates system-wide.

**2. `src/pages/ComponentsGallery.tsx` (lines 872, 886)** -- Update the two toggle section labels:

```tsx
// Before (line 872)
<Label className="text-body-sm font-medium mb-2 block">Two-Option Toggle</Label>

// After
<Label className="mb-2 block">Two-Option Toggle</Label>

// Before (line 886)
<Label className="text-body-sm font-medium mb-2 block">Multi-Option Toggle</Label>

// After
<Label className="mb-2 block">Multi-Option Toggle</Label>
```

The `Label` primitive already bakes in `text-body` and `font-medium`, so the overrides are redundant and can be removed.

### Review
1. **Top 3 Risks:** (a) Toggle pill items may appear slightly larger -- acceptable, meets legibility standard. (b) System-wide change via master template -- intended. (c) None other.
2. **Top 3 Fixes:** (a) All toggle text meets 16px minimum. (b) Labels use primitive defaults, removing redundant overrides. (c) Consistent with Label typography memory.
3. **Database Change:** No.
4. **Verdict:** Go -- one CSS line + two label cleanups.
