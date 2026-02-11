

## Refactor Form Text Elements: Standardized Naming Conventions

### What Changes

Introduce two new CSS utility classes and update all form field text elements in the Style Guide to use standardized naming. No visual changes -- layout, colors, and positions remain identical.

### New CSS Classes

Added to `src/index.css` in the `@layer components` section:

| Class Name | Replaces | Styles (unchanged visually) |
|------------|----------|----------------------------|
| `.form-helper-text` | Inline `text-xs text-foreground mt-0 mb-1.5` | `@apply text-xs text-foreground mt-0 mb-1.5;` |
| `.form-additional-text` | Inline `text-xs text-muted-foreground italic mt-1.5` | `@apply text-xs text-muted-foreground italic mt-1.5;` |

### File Changes

**1. `src/index.css`** -- Add two new classes inside `@layer components`

```css
/* Form Helper Text - between label and input */
.form-helper-text {
  @apply text-xs text-foreground mt-0 mb-1.5;
}

/* Form Additional Text - below input/control */
.form-additional-text {
  @apply text-xs text-muted-foreground italic mt-1.5;
}
```

**2. `src/pages/ComponentsGallery.tsx`** -- Replace inline classes with new class names

Six replacements total (3 helper text, 3 additional text):

- Line 737: `className="text-xs text-foreground mt-0 mb-1.5"` becomes `className="form-helper-text"`
- Line 742: `className="text-xs text-muted-foreground italic mt-1.5"` becomes `className="form-additional-text"`
- Line 749: `className="text-xs text-foreground mt-0 mb-1.5"` becomes `className="form-helper-text"`
- Line 752: `className="text-xs text-muted-foreground italic mt-1.5"` becomes `className="form-additional-text"`
- Line 847: `className="text-xs text-foreground mt-0 mb-1.5"` becomes `className="form-helper-text"`
- Line 859: `className="text-xs text-muted-foreground italic mt-1.5"` becomes `className="form-additional-text"`

### What Stays the Same

- All visual positions, colors, sizes, and spacing remain identical
- No structural HTML changes
- No new components or props introduced
- All other form controls (switches, toggles, checkboxes, radio groups) unchanged

### Review

- **Top 5 Risks:** (1) No visual regression risk -- CSS classes map to identical Tailwind utilities. (2) No other files use these inline patterns, so no missed references. (3) No accessibility impact -- same contrast and sizing. (4) No functional impact. (5) No data or security impact.
- **Top 5 Fixes:** (1) Centralizes form text styling into reusable CSS classes. (2) Standardizes naming to `form-helper-text` and `form-additional-text`. (3) Makes future style changes single-point updates. (4) Reduces inline class duplication. (5) Improves code readability and maintainability.
- **Database Change Required:** No
- **Go/No-Go:** Go
