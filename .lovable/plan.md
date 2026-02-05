

## Implement Flush Prop for Table Component

### Summary

Add a `flush` prop to the Table component that removes border-radius, then apply it to the AssignVideosModal table for edge-to-edge layout in fullscreen dialogs.

---

### Changes Required

#### 1. Update Table Component

**File:** `src/components/ui/table.tsx` (lines 1-17)

**Before:**
```tsx
import * as React from "react"

import { cn } from "@/lib/utils"

const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-hidden rounded-lg">
    <table
      ref={ref}
      className={cn("w-full caption-bottom text-sm", className)}
      {...props}
    />
  </div>
))
Table.displayName = "Table"
```

**After:**
```tsx
import * as React from "react"

import { cn } from "@/lib/utils"

interface TableProps extends React.HTMLAttributes<HTMLTableElement> {
  /** When true, removes border-radius for edge-to-edge layouts in dialogs */
  flush?: boolean;
}

const Table = React.forwardRef<HTMLTableElement, TableProps>(
  ({ className, flush = false, ...props }, ref) => (
    <div className={cn(
      "relative w-full overflow-hidden",
      !flush && "rounded-lg"
    )}>
      <table
        ref={ref}
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      />
    </div>
  )
)
Table.displayName = "Table"
```

---

#### 2. Apply Flush Prop in AssignVideosModal

**File:** `src/components/dashboard/AssignVideosModal.tsx` (line 729)

| Before | After |
|--------|-------|
| `<Table>` | `<Table flush>` |

---

### What This Does

- **Table component**: Gains a new optional `flush` prop (defaults to `false`)
- **When `flush={true}`**: Table wrapper has no border-radius (square corners)
- **When `flush={false}` or omitted**: Table keeps existing `rounded-lg` styling
- **AssignVideosModal**: Uses `flush` to make table extend edge-to-edge in fullscreen dialog

---

### Reusability

Any future fullscreen dialog with a table can simply add `flush` to get the same edge-to-edge appearance:

```tsx
<FullscreenDialogContent>
  <Table flush>
    ...
  </Table>
</FullscreenDialogContent>
```

