

## Fix Table Header Background Extending Beyond Border Radius

### Problem

The `bg-muted` background on `TableHeader` extends beyond the rounded corners of the parent Card because there's no clipping applied to the table container.

### Root Cause

The structure flows like this:

```text
Card (rounded-lg border)
  └── CardContent (p-0)
        └── Table wrapper div (overflow-auto ← problem here)
              └── table
                    └── TableHeader (bg-muted ← extends to square corners)
```

The Table component's wrapper div has `overflow-auto` but lacks:
1. `overflow-hidden` to clip content to boundaries
2. Matching `rounded-lg` to inherit the corner rounding

### Solution

Update the Table component wrapper to include `overflow-hidden` and `rounded-lg` so the TableHeader background is properly clipped to the rounded corners.

---

### Changes Required

**File:** `src/components/ui/table.tsx` - Line 9

| Before | After |
|--------|-------|
| `relative w-full overflow-auto` | `relative w-full overflow-hidden rounded-lg` |

**Note:** Using `overflow-hidden` instead of `overflow-auto` will clip content properly. For tables that need horizontal scrolling, the parent container (like CardContent) can handle that with its own overflow settings.

---

### Updated Code

```tsx
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
```

---

### Visual Result

- Table headers will respect the Card's rounded corners
- The `bg-muted` background will be clipped at the corners
- Consistent visual appearance across all tables in the application

