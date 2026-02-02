

## Implement FullscreenDialogContent Component

### Overview
Adding a new `FullscreenDialogContent` component to the dialog system and showcasing it in the Component Gallery. The base `DialogContent` remains unchanged.

---

### File Changes

#### File 1: `src/components/ui/dialog.tsx`

**Add new component** after `DialogContent` (after line 52):

```tsx
const FullscreenDialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed inset-2 sm:inset-2.5 z-50 border bg-background shadow-lg rounded-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 flex flex-col [&>:not([data-dialog-header]):not([data-dialog-footer]):not([data-dialog-scroll-area])]:px-6 [&>:not([data-dialog-header]):not([data-dialog-footer]):not([data-dialog-scroll-area])]:py-6",
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-2 top-2 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground z-10">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
))
FullscreenDialogContent.displayName = "FullscreenDialogContent"
```

**Update exports** (line 115-126) to include the new component:

```tsx
export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  FullscreenDialogContent,
  DialogHeader,
  DialogScrollArea,
  DialogFooter,
  DialogTitle,
}
```

---

#### File 2: `src/pages/ComponentsGallery.tsx`

**Update import** (line 21) to include the new component:

```tsx
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogScrollArea, DialogTitle, DialogTrigger, FullscreenDialogContent, DialogClose } from "@/components/ui/dialog";
```

**Add fullscreen dialog example** after the existing Dialog (after line 1451):

```tsx
<Dialog>
  <DialogTrigger asChild>
    <Button variant="secondary" className="shadow-md hover:shadow-lg transition-shadow">Open Fullscreen Dialog</Button>
  </DialogTrigger>
  <FullscreenDialogContent>
    <DialogHeader>
      <DialogTitle>Fullscreen Dialog</DialogTitle>
    </DialogHeader>
    <DialogScrollArea>
      <div className="space-y-4">
        <p>This fullscreen dialog fills the entire viewport with 8px spacing on mobile and 10px on larger screens.</p>
        <p>It's ideal for immersive content, detailed forms, media viewers, or any content that benefits from maximum screen space.</p>
        <p>The transparent overlay remains visible behind the dialog, maintaining visual context of the underlying page.</p>
      </div>
    </DialogScrollArea>
    <DialogFooter>
      <DialogClose asChild>
        <Button variant="outline" className="shadow-md hover:shadow-lg transition-shadow">Cancel</Button>
      </DialogClose>
      <Button className="shadow-md hover:shadow-lg transition-shadow">Save Changes</Button>
    </DialogFooter>
  </FullscreenDialogContent>
</Dialog>
```

---

### Key Implementation Details

| Feature | Implementation |
|---------|----------------|
| Layout | `flex flex-col` only (no grid conflict) |
| Mobile spacing | `inset-2` (8px) for touch-friendly margins |
| Desktop spacing | `sm:inset-2.5` (10px) for larger screens |
| Close button | Offset to `right-2 top-2` for better accessibility |
| Padding inheritance | Same `[&>:not(...)]` rules as base dialog |
| Animations | Simple fade in/out (no sliding) |

---

### Visual Comparison

```text
Standard Dialog:              Fullscreen Dialog:
┌──────────────────────┐      ┌──────────────────────┐
│                      │      │ ┌──────────────────┐ │
│    ┌──────────┐      │      │ │                  │ │
│    │  Content │      │      │ │  Content fills   │ │
│    │ (512px)  │      │      │ │  entire screen   │ │
│    └──────────┘      │      │ │                  │ │
│                      │      │ └──────────────────┘ │
└──────────────────────┘      └──────────────────────┘
                                ↑ 8-10px spacing
```

---

### Usage After Implementation

```tsx
// Standard centered dialog (unchanged)
<DialogContent>...</DialogContent>

// New fullscreen dialog
<FullscreenDialogContent>...</FullscreenDialogContent>
```

Both work seamlessly with `DialogHeader`, `DialogScrollArea`, `DialogFooter`, and `DialogTitle`.

