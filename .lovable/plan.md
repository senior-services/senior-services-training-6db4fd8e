

## Update Form Controls in Style Guide -- Revised

### What Changes

Update the Form Controls section in the Style Guide to document two distinct types of supporting text for form fields. Additionally, ensure dropdowns, checkbox groups, and radio button groups always include "additional context" examples, since those field types benefit most from supplementary guidance.

### Two Helper Text Types

| Type | Position | Style | Purpose |
|------|----------|-------|---------|
| **Helper Text** | Between label and input | `text-xs text-foreground mt-0 mb-1.5` (primary color) | Brief instruction before user interacts |
| **Additional Context** | Below the input/control | `text-xs text-muted-foreground italic mt-1.5` (secondary, italic) | Extra tips, constraints, or clarification |

### Detailed Changes

**File: `src/pages/ComponentsGallery.tsx`**

**1. Update the "Email Address" field (lines 734-740)**

Replace the existing single helper text demo with both types demonstrated together:

- **Helper text** (above input): "We'll use this to send you login instructions." -- styled `text-xs text-foreground mt-0 mb-1.5`
- **Additional context** (below input): "Must be a valid company email address." -- styled `text-xs text-muted-foreground italic mt-1.5`

Label + helper text wrapped in a single `div` to prevent spacing issues from parent `space-y-*`.

**2. Add additional context to Select Dropdown (lines 835-847)**

Below the `Select` component, add:
```
"You can change this selection at any time."
```
Styled as `text-xs text-muted-foreground italic mt-1.5`.

**3. Add additional context to Radio Button Group (lines 797-817)**

Below the `RadioGroup` component, add:
```
"Select the size that best fits your needs."
```
Styled as `text-xs text-muted-foreground italic mt-1.5`.

**4. Add additional context to Checkbox Group (lines 819-833)**

Below the checkbox group container, add:
```
"You can select multiple options. Changes take effect immediately."
```
Styled as `text-xs text-muted-foreground italic mt-1.5`.

### What Stays the Same

- All other form control examples (disabled input, textarea, switches, toggles, single checkbox) remain unchanged
- Section header and card layout unchanged
- No new components or imports needed

### Review

- **Top 5 Risks:** (1) Helper text color change from `text-muted-foreground` to `text-foreground` increases visual weight -- intentional per request. (2) Existing forms across the app still use old pattern -- this is style guide only, not a refactor. (3) No accessibility regression -- both text types maintain WCAG AA contrast. (4) No functional impact. (5) No data or security impact.
- **Top 5 Fixes:** (1) Documents two distinct helper text patterns clearly. (2) Dropdowns, checkbox groups, and radio groups always show additional context. (3) Italic styling on additional context creates clear visual hierarchy. (4) Wrapper pattern prevents spacing issues. (5) Examples can be used independently or together.
- **Database Change Required:** No
- **Go/No-Go:** Go
