

## Add Helper Text Pattern to Component Gallery

### What's changing
Adding a new "Helper Text" example to the Form Controls section of the Component Gallery. This demonstrates the pattern for optional descriptive text that sits between a field label and its input, using small size and secondary/muted color.

### Changes (1 file)

**File: `src/pages/ComponentsGallery.tsx`**

In the Form Controls section (around line 720-733, left column), add a new example field that shows a Label, helper text paragraph, and Input together:

```
<div>
  <Label htmlFor="helper-input">Email Address</Label>
  <p className="text-xs text-muted-foreground mt-1 mb-1.5">
    We'll use this to send you login instructions.
  </p>
  <Input id="helper-input" placeholder="you@example.com" />
</div>
```

This will be added as a new field example alongside the existing Text Input, Disabled Input, and Textarea examples -- providing a clear visual reference for when and how to use helper text.

### Pattern being documented
- Helper text uses `text-xs` (14px per project standards) for small size
- Uses `text-muted-foreground` for secondary color
- Positioned between Label and Input with `mt-1 mb-1.5` spacing
- Content is brief, instructional, and optional

### STYLEGUIDE.md update
Add a new "Helper Text" subsection under Form Controls Spacing Guidelines documenting:
- Use `<p className="text-xs text-muted-foreground mt-1 mb-1.5">` between Label and Input
- Helper text is always optional -- most fields won't need it
- Keep text concise (one short sentence)

### Review
- **Top 5 Risks**: (1) Minimal -- purely additive UI example. (2) Spacing values (mt-1 mb-1.5) should be verified visually. (3) No logic changes. (4) No accessibility concerns -- helper text is readable. (5) No risk to existing components.
- **Top 5 Fixes**: (1) Add helper text example to gallery. (2) Update STYLEGUIDE.md with pattern docs. (3) Use consistent spacing tokens. (4) Match existing gallery card structure. (5) Keep example realistic.
- **Database Change Required**: No
- **Go/No-Go**: Go
