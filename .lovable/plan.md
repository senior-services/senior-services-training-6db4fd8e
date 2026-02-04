

## Change Unassign Button to Solid Destructive Style

### Current State

The "Unassign" button in the Assign Videos dialog currently uses an outline style with destructive colors:
- Uses `variant="outline"` 
- Custom classes: `border-destructive text-destructive hover:bg-destructive/10`

This gives it a red border and red text, but not a solid red background.

### Change

**File: `src/components/dashboard/AssignVideosModal.tsx`**

**Lines 646-656** - Change from outline to destructive variant and remove custom className:

```tsx
// Current:
<ButtonWithTooltip
  variant="outline"
  onClick={() => setShowUnassignDialog(true)}
  disabled={isSubmitting || hasCompetingSelections}
  size="sm"
  tooltip={...}
  className="border-destructive text-destructive hover:bg-destructive/10"
>

// Updated:
<ButtonWithTooltip
  variant="destructive"
  onClick={() => setShowUnassignDialog(true)}
  disabled={isSubmitting || hasCompetingSelections}
  size="sm"
  tooltip={...}
>
```

### Result

| Property | Before | After |
|----------|--------|-------|
| Background | Transparent | Solid red (`bg-destructive`) |
| Text | Red (`text-destructive`) | White (`text-destructive-foreground`) |
| Border | Red (`border-destructive`) | None |
| Hover | Light red tint | Slightly darker red |

The button will now have a solid red background with white text, making it more visually distinct as a destructive action.

