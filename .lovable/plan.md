

## Refactor Form Field Text Naming Across the Application

### What Changes

Update the two remaining files that use inline form helper text classes to use the standardized `.form-helper-text` CSS class. These are the only instances outside the Style Guide that match the pattern.

### Files to Change

**1. `src/components/quiz/CreateQuizModal.tsx` (line 306)**

Replace:
```
className="text-xs text-muted-foreground mt-0 mb-1.5"
```
With:
```
className="form-helper-text"
```

This text sits between the "Answer Options" label and the answer option inputs -- it is helper text by definition.

**2. `src/components/EditVideoModal.tsx` (line 1127)**

Replace:
```
className="text-xs text-muted-foreground mt-0 mb-1.5"
```
With:
```
className="form-helper-text"
```

Same pattern -- helper text between label and controls.

**Note:** These two instances currently use `text-muted-foreground` (secondary color) rather than `text-foreground` (primary color). Applying `.form-helper-text` will change them to primary color to match the standardized pattern. The position and size remain identical.

### What Stays the Same

- No layout or structural changes
- No new props or interfaces needed (these are inline `<p>` tags, not component props)
- Style Guide examples already updated in previous changes
- CSS classes in `src/index.css` already defined
- All other form fields, toasts, dialogs, cards using "description" in their standard component APIs are unrelated to this pattern and remain unchanged

### Scope Clarification

No other files in the application use custom form helper/additional text patterns. The `description` prop used in Toast, Card, AlertDialog, and Banner components is part of their standard Radix/shadcn API and is not related to form field helper text -- these are left unchanged.

### Review

- **Top 5 Risks:** (1) Color shift from `text-muted-foreground` to `text-foreground` on two helper texts -- minor visual change, aligns with standard. (2) No other risks -- two single-line class swaps. (3) No accessibility regression. (4) No functional impact. (5) No data or security impact.
- **Top 5 Fixes:** (1) Completes standardization across the entire app. (2) Single-point style updates now possible via CSS class. (3) Consistent naming convention enforced. (4) Only two files need changes. (5) Clean, minimal refactor.
- **Database Change Required:** No
- **Go/No-Go:** Go
