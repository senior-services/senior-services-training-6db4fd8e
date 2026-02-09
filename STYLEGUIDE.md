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

### Helper Text

Use optional helper text between a `Label` and its input to provide brief, contextual instructions.

**✅ Correct Usage:**
```tsx
<div>
  <Label htmlFor="email">Email Address</Label>
  <p className="text-xs text-muted-foreground mt-1 mb-1.5">
    We'll use this to send you login instructions.
  </p>
  <Input id="email" placeholder="you@example.com" />
</div>
```

**Guidelines:**
- Uses `text-xs` size and `text-muted-foreground` color
- Spacing: `mt-1` below label, `mb-1.5` above input
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

**When to use Banner vs Toast vs AlertDialog:**
- **Banner**: Persistent notifications, page-level alerts, status messages
- **Toast**: Temporary feedback, success/error confirmations
- **AlertDialog**: Modal confirmations, destructive action warnings

### ESLint Rules

The following ESLint rules are enforced to maintain consistency:

- No `className` attribute allowed on `RadioGroup` components
- No `className` attribute allowed on individual `Checkbox` components
- **Prefer Banner over Alert**: Use the unified `Banner` component instead of the deprecated `Alert` component

Use the wrapper components instead to achieve proper spacing and styling.