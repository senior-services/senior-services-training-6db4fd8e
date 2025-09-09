# UI Components Style Guide

## Form Controls Spacing Guidelines

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

### OptionList and OptionRow Components

Use these wrapper components to maintain consistent spacing:

- `OptionList`: Provides vertical spacing between options (`space-y-3`)
- `OptionRow`: Provides horizontal spacing within each option (`flex items-center space-x-2`)

These components ensure consistent spacing across all form controls throughout the application and align with the Component Gallery design standards.

### Banner Component Usage

The `Banner` component is the unified component for notifications, alerts, status messages, and announcements. It replaces the deprecated `Alert` component.

**Variants:**
- `default` - neutral messaging
- `info` - informational content (blue theme)
- `success` - positive feedback (green theme)  
- `warning` - cautionary messages (yellow theme)
- `error` - error states (red theme)
- `destructive` - destructive actions (red theme, alias for error)

**Features:**
- Optional title and description
- Optional action buttons via `actions` prop
- Optional dismiss functionality via `dismissible` and `onDismiss`
- Optional icon display via `showIcon` prop
- Built-in modern drop shadow (`shadow-card hover:shadow-lg`)
- Accessibility support with `role="alert"`

**✅ Correct Usage:**
```tsx
<Banner
  variant="warning"
  title="Action Required"
  description="Your account needs verification."
  actions={
    <Button size="sm" variant="outline">
      Verify Now
    </Button>
  }
  dismissible
  onDismiss={() => handleDismiss()}
/>
```

**When to use Banner vs Toast vs AlertDialog:**
- **Banner**: Persistent contextual information, status updates, or actionable messages that remain visible
- **Toast**: Temporary feedback messages that auto-dismiss
- **AlertDialog**: Critical decisions requiring user confirmation before proceeding

### ESLint Rules

The following ESLint rules are enforced to maintain consistency:

- No `className` attribute allowed on `RadioGroup` components
- No `className` attribute allowed on individual `Checkbox` components
- **Prefer Banner over Alert**: Use the unified `Banner` component instead of the deprecated `Alert` component

Use the wrapper components instead to achieve proper spacing and styling.