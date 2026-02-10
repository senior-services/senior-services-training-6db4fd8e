

## Tooltip Arrow Alignment Support and Attestation Fix

### What Changes

1. **Add `align` prop support to `TooltipContent`** -- Radix UI's `TooltipContent` already supports an `align` prop (`"start"`, `"center"`, `"end"`). We just need to surface it explicitly and document the three alignment options.

2. **Fix attestation checkbox tooltip positioning** -- Set `side="top"` and `align="start"` on the attestation tooltip so the arrow sits on the far left, centered over the checkbox. Increase `sideOffset` to 6 for comfortable spacing.

3. **Update STYLEGUIDE.md** -- Add usage examples for each alignment variant.

### Changes (3 files)

**File 1: `src/components/ui/tooltip.tsx`**

No structural changes needed -- Radix already passes `align` through `...props`. However, we should destructure `align` explicitly to make it clear in the component signature and ensure proper TypeScript discoverability:

```tsx
const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, align = "center", children, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    align={align}
    className={cn(
      "z-50 overflow-hidden rounded-md bg-foreground px-3 py-1.5 text-xs text-background shadow-md max-w-[300px] animate-in fade-in-0 zoom-in-95 ...",
      className
    )}
    {...props}
  >
    {children}
    <TooltipPrimitive.Arrow className="fill-foreground" />
  </TooltipPrimitive.Content>
))
```

**File 2: `src/components/VideoPlayerFullscreen.tsx`** (lines ~579-599)

Update the attestation tooltip to use `side="top"`, `align="start"`, and `sideOffset={6}`:

```tsx
<TooltipContent side="top" align="start" sideOffset={6}>
  <p>Complete the questions above to enable this checkbox.</p>
</TooltipContent>
```

**File 3: `STYLEGUIDE.md`**

Replace the existing Tooltip Styling section with expanded documentation including alignment examples:

- Default (center-aligned arrow)
- Start-aligned arrow (`align="start"`) -- arrow on the left
- End-aligned arrow (`align="end"`) -- arrow on the right
- Side options (`side="top" | "bottom" | "left" | "right"`)
- Spacing guidance (`sideOffset` for gap control)

Example code snippets for each variant will be provided.

### Review
- **Top 5 Risks**: (1) None -- `align` is a native Radix prop already supported, just not explicitly surfaced. (2) No visual regression on existing tooltips since default remains `"center"`. (3) Arrow automatically repositions with alignment. (4) No layout shift. (5) No database impact.
- **Top 5 Fixes**: (1) Destructure `align` in TooltipContent for clarity. (2) Set `align="start"` and `sideOffset={6}` on attestation tooltip. (3) Document alignment variants in styleguide. (4-5) N/A.
- **Database Change Required**: No
- **Go/No-Go**: Go

