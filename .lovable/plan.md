

## Implement Competing Selection Logic with Recommended Fixes

### Overview
Add logic to disable both Assign and Unassign buttons when conflicting selections exist, with accessible tooltips and improved styling.

---

### File to Modify

**`src/components/dashboard/AssignVideosModal.tsx`**

---

### Change 1: Import ButtonWithTooltip (Line 27)

Replace Button-only import with ButtonWithTooltip:

```tsx
import { ButtonWithTooltip } from '@/components/ui/button-with-tooltip';
```

---

### Change 2: Add Competing Selection Logic (After Line 489)

Add conflict detection variables:

```tsx
const hasCompetingSelections = canAssign && canUnassign;
const competingTooltip = "Clear conflicting selections first";
```

---

### Change 3: Update Action Buttons (Lines 533-554)

Replace current buttons with conflict-aware ButtonWithTooltip components:

```tsx
{/* Action buttons moved to header */}
<div className="flex items-center gap-2">
  {selectedUnassignedCount > 0 && (
    <ButtonWithTooltip
      onClick={() => setShowDueDateDialog(true)} 
      disabled={isSubmitting || hasCompetingSelections}
      size="sm"
      tooltip={hasCompetingSelections ? competingTooltip : `Assign ${selectedUnassignedCount} training${selectedUnassignedCount !== 1 ? 's' : ''}`}
    >
      Assign ({selectedUnassignedCount})
    </ButtonWithTooltip>
  )}
  {selectedAssignedCount > 0 && (
    <ButtonWithTooltip
      variant="outline"
      onClick={() => setShowUnassignDialog(true)}
      disabled={isSubmitting || hasCompetingSelections}
      size="sm"
      tooltip={hasCompetingSelections ? competingTooltip : `Unassign ${selectedAssignedCount} training${selectedAssignedCount !== 1 ? 's' : ''}`}
      className="border-destructive text-destructive hover:bg-destructive/10"
    >
      Unassign ({selectedAssignedCount})
    </ButtonWithTooltip>
  )}
</div>
```

---

### Behavior Summary

| Selection State | Assign Button | Unassign Button |
|-----------------|---------------|-----------------|
| No selections | Hidden | Hidden |
| Only unassigned selected | Enabled with count tooltip | Hidden |
| Only assigned selected | Hidden | Enabled with count tooltip (destructive outline) |
| Both types selected | Disabled - "Clear conflicting selections first" | Disabled - "Clear conflicting selections first" |
| During submission | Disabled | Disabled |

---

### Visual Result

**Normal state (only unassigned selected):**
```
[Assign (3)]  ← Blue primary button
```

**Normal state (only assigned selected):**
```
[Unassign (2)]  ← Red outline destructive button
```

**Competing selections:**
```
[Assign (2)] [Unassign (1)]  ← Both grayed out, disabled
     ↑
Tooltip: "Clear conflicting selections first"
```

---

### Accessibility Notes

- ButtonWithTooltip ensures tooltips work on disabled buttons via focusable wrapper span
- Short, action-oriented tooltip text is easier to understand
- Destructive outline style provides clear visual warning without being too aggressive


