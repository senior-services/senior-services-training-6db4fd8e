

## Add `.form-section-header` Semantic Class and Style Guide Entry

### Overview
Create a new `.form-section-header` semantic class in `src/index.css` and add a matching live preview in the Form Controls section of the Components Gallery.

### Changes

**1. `src/index.css` -- New Semantic Class (after line 509, alongside existing form helpers)**

Add a new class following the same pattern as `.form-helper-text` and `.form-additional-text`:

```css
/* Form Section Header - labels groups of related fields */
.form-section-header {
  @apply text-body font-bold text-foreground mt-6 mb-2;
}
```

**2. `src/pages/ComponentsGallery.tsx` -- Live Preview (insert after line 825, before line 826)**

Insert a new demonstration block at the top of the Form Controls `CardContent`, above the existing input fields:

```tsx
{/* Form Section Header */}
<div className="rounded-lg p-6 border border-border-primary/50 shadow-md space-y-1">
  <h4 className="text-body font-bold text-foreground mb-3">Form Section Header</h4>
  <p className="text-body-sm text-muted-foreground mb-4">
    Use to label groups of related form fields. Apply the single
    <code className="text-code bg-muted px-1 py-0.5 rounded">.form-section-header</code> class -- no additional utilities needed.
  </p>
  <div className="rounded-md bg-card/50 p-4">
    <h3 className="form-section-header !mt-0">Contact Information</h3>
    <Input placeholder="Enter your email..." className="shadow-sm" />

    <h3 className="form-section-header">Administrative Settings</h3>
    <Input placeholder="Enter department..." className="shadow-sm" />
  </div>
</div>
```

The first header uses `!mt-0` to suppress top margin since it is the first element in its container. The second header naturally shows the `mt-6` spacing gap.

### Design System Audit
- **Typography**: `.text-body` composite token only -- no raw sizing utilities.
- **Weight**: `font-bold` baked into the semantic class (80/20 rule for forms).
- **Color**: `text-foreground` semantic CSS variable -- no hardcoded hex.
- **Spacing**: `mt-6` / `mb-2` are standard 4px-grid Tailwind steps -- no arbitrary bracket values.
- **No new dependencies or primitives.**

### Review
1. **Top 3 Risks**: (a) None -- additive only. (b) No existing class conflicts. (c) No production component impact.
2. **Top 3 Fixes**: (a) Centralizes a previously ad-hoc pattern. (b) Provides live reference. (c) Prevents utility sprawl.
3. **Database Change**: No.
4. **Verdict**: Go -- two-file, additive change.

