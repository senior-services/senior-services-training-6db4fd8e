# UI Components Style Guide

## Typography Scale — Major Third (1.250)

All text sizing follows a **Major Third** modular scale with a 16px (1rem) base. Components must use global CSS tags (`h1`–`h6`, `p`) or the semantic classes below — never raw Tailwind `text-*` utilities for font sizing.

| Step | Rem | Pixels | Semantic Class | Usage |
|------|-----|--------|---------------|-------|
| h1 | 3.052rem | ~49px | `<h1>` | Page titles |
| h2 | 1.953rem | ~31px | `<h2>` | Section headings |
| h3 | 1.563rem | ~25px | `<h3>` | Subsection headings |
| h4 | 1.25rem | 20px | `<h4>` | Minor headings / labels |
| body | 1rem | 16px | `.text-body` | Body text (Regular/Medium/Bold) |
| small | 0.8rem | ~13px | `.text-small` | Secondary info, helper text |
| caption | 0.64rem | ~10px | `.text-caption` | Captions, metadata |
| code | 0.9375rem | 15px | `.text-code` | Monospace code snippets |

### Tailwind Token Mapping

The Tailwind `fontSize` tokens are remapped to align with this scale:

| Token | Value | Scale Step |
|-------|-------|-----------|
| `text-xs` | 0.64rem | caption |
| `text-sm` | 0.8rem | small |
| `text-base` | 1rem | body |
| `text-lg` | 1.25rem | h4 |
| `text-xl` | 1.563rem | h3 |
| `text-2xl` | 1.953rem | h2 |
| `text-3xl` | 3.052rem | h1 |
| `text-code` | 0.9375rem | code |

### RadioGroup Components

RadioGroup components should use the default spacing provided by the component. Do not override with custom `className` attributes for spacing.

**✅ Correct Usage:**
```tsx
<RadioGroup value={selectedValue} onValueChange={setValue}>
  <OptionRow>
    <RadioGroupItem value="option1" id="option1" />
    <Label htmlFor="option1">Option 1</Label>
  </OptionRow>
  <OptionRow>
    <RadioGroupItem value="option2" id="option2" />
    <Label htmlFor="option2">Option 2</Label>
  </OptionRow>
</RadioGroup>
```

**❌ Incorrect Usage:**
```tsx
<RadioGroup value={selectedValue} onValueChange={setValue} className="space-y-3">
  <div className="flex items-center space-x-2">
    <RadioGroupItem value="option1" id="option1" />
    <Label htmlFor="option1">Option 1</Label>
  </div>
</RadioGroup>
```

### Checkbox Groups

Use the `OptionList` wrapper for consistent spacing between checkbox groups.

**✅ Correct Usage:**
```tsx
<OptionList>
  <OptionRow>
    <Checkbox id="checkbox1" />
    <Label htmlFor="checkbox1">Option 1</Label>
  </OptionRow>
  <OptionRow>
    <Checkbox id="checkbox2" />
    <Label htmlFor="checkbox2">Option 2</Label>
  </OptionRow>
</OptionList>
```

**❌ Incorrect Usage:**
```tsx
<div className="space-y-3">
  <div className="flex items-center space-x-2">
    <Checkbox id="checkbox1" className="..." />
    <Label htmlFor="checkbox1">Option 1</Label>
  </div>
</div>
```

### Helper Text

Use optional helper text between a `Label` and its input to provide brief, contextual instructions.

**✅ Correct Usage:**
```tsx
<div>
  <Label htmlFor="email">Email Address</Label>
  <p className="text-xs text-muted-foreground mt-0 mb-1.5">
    We'll use this to send you login instructions.
  </p>
  <Input id="email" placeholder="you@example.com" />
</div>
```

**Guidelines:**
- Uses `text-xs` size and `text-muted-foreground` color
- Spacing: `mt-0` resets browser default paragraph margin; `mb-1.5` above input
- Keep text to one short sentence
- Most fields won't need helper text — use only when clarification adds value

### OptionList and OptionRow Components

Use these wrapper components to maintain consistent spacing:

- `OptionList`: Provides vertical spacing between options (`space-y-3`)
- `OptionRow`: Provides horizontal spacing within each option (`flex items-center space-x-2`)

These components ensure consistent spacing across all form controls throughout the application and align with the Component Gallery design standards.

### Banner Component Usage

Use the `Banner` component as the unified solution for all notifications, alerts, and status messages. The deprecated `Alert` component should not be used.

**Available Variants:**
- `default` - Standard banner with neutral styling
- `info` / `information` - Informational messages (blue styling)
- `success` - Success confirmations (green styling)  
- `warning` - Warnings and cautionary messages (yellow styling)
- `error` / `destructive` - Error states and destructive actions (red styling)

**Consistent Features (all variants support):**
- **Close action**: Use `dismissible` prop and `onDismiss` callback
- **Action buttons**: Use `actions` prop to add buttons
- **Icon display**: Use `showIcon` prop (true by default)
- **Custom content**: Use `title`, `description`, or `children` props

**✅ Correct Usage:**

```tsx
// Basic banner
<Banner 
  variant="info" 
  title="Information" 
  description="Your message here" 
/>

// With all options
<Banner 
  variant="warning"
  title="Action Required"
  description="Important message"
  dismissible
  onDismiss={() => handleDismiss()}
  showIcon={true}
  actions={
    <Button variant="outline" size="sm">
      Take Action
    </Button>
  }
/>

// Without icon
<Banner 
  variant="success"
  title="Success"
  description="Operation completed"
  showIcon={false}
/>
```

**Inline Banners (Compact):**

Use `size="compact"` with `description` only (no `title`) for brief, contextual messages within forms or sections. Use full banners for page-level alerts.

```tsx
// Compact inline info
<Banner variant="info" size="compact" description="This field is optional." />

// Compact inline warning
<Banner variant="warning" size="compact" description="Changes will take effect immediately." />

// Compact inline success
<Banner variant="success" size="compact" description="All answers saved." />

// Compact inline error
<Banner variant="error" size="compact" description="Please fix the errors above." />

// Compact with dismiss
<Banner 
  variant="attention" 
  size="compact" 
  description="Review pending items before submitting." 
  dismissible 
  onDismiss={() => handleDismiss()} 
/>
```

**When to use Banner vs Toast vs AlertDialog:**
- **Banner**: Persistent notifications, page-level alerts, status messages
- **Banner (compact)**: Inline contextual messages within forms or sections
- **Toast**: Temporary feedback, success/error confirmations
- **AlertDialog**: Modal confirmations, destructive action warnings

### ESLint Rules

The following ESLint rules are enforced to maintain consistency:

- No `className` attribute allowed on `RadioGroup` components
- No `className` attribute allowed on individual `Checkbox` components
- **Prefer Banner over Alert**: Use the unified `Banner` component instead of the deprecated `Alert` component

Use the wrapper components instead to achieve proper spacing and styling.

### Toggle Components

All Toggle and ToggleGroup items use `text-xs` (14px) for consistency with Labels, Badge, and Tooltip typography standards. This is set globally in the `toggleVariants` CVA definition in `src/components/ui/toggle.tsx`.

### Tooltip Styling

All tooltips use a high-contrast dark background (`bg-foreground`) with white text (`text-background`), extra-small text (`text-xs`), a max width of `300px`, and include a directional arrow by default. Meets WCAG AA contrast in both light and dark modes.

#### Arrow Alignment

The `align` prop controls where the arrow sits relative to the trigger element:

| Align | Arrow Position | Use When |
|-------|---------------|----------|
| `"center"` (default) | Centered on tooltip | General use |
| `"start"` | Far left (top/bottom) or top (left/right) | Tooltip trigger is at a left edge |
| `"end"` | Far right (top/bottom) or bottom (left/right) | Tooltip trigger is at a right edge |

#### Side & Spacing

- `side`: `"top"` | `"bottom"` | `"left"` | `"right"` (default: `"top"`)
- `sideOffset`: Gap in px between trigger and tooltip (default: `4`, use `6` for more breathing room)

#### Examples

**Default (centered arrow):**
```tsx
<Tooltip>
  <TooltipTrigger>Hover me</TooltipTrigger>
  <TooltipContent>Default centered tooltip</TooltipContent>
</Tooltip>
```

**Start-aligned arrow (left):**
```tsx
<Tooltip>
  <TooltipTrigger>Hover me</TooltipTrigger>
  <TooltipContent side="top" align="start" sideOffset={6}>
    Arrow on the left
  </TooltipContent>
</Tooltip>
```

**End-aligned arrow (right):**
```tsx
<Tooltip>
  <TooltipTrigger>Hover me</TooltipTrigger>
  <TooltipContent side="top" align="end" sideOffset={6}>
    Arrow on the right
  </TooltipContent>
</Tooltip>
```