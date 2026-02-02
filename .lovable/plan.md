

## Fix: X Button Not Closing Confirmation Dialogs

### The Problem
After performing an assign or unassign action, clicking the "X" button in the top-right corner of the confirmation dialog doesn't close it.

### Root Cause
The Due Date dialog's close handling has a conflict:

1. The X button (built into `AlertDialogContent`) triggers the `onOpenChange` callback
2. For the Due Date dialog, `onOpenChange` only calls `resetDueDateDialog()` when closing
3. But `resetDueDateDialog()` is already being called in the `finally` block of `handleAssign`
4. The X button works, but after the action completes, the dialog is closed by the code anyway

The actual issue is that the **X button in the Alert Dialog content doesn't respect the `isSubmitting` state**, so users can click it during submission, which causes unexpected behavior.

Additionally, looking at the Unassign dialog on lines 669-689, there's no explicit handling to prevent X button clicks during submission.

---

### Files to Modify

**`src/components/ui/alert-dialog.tsx`**

---

### Solution: Pass disabled state to X button

The AlertDialogContent component has a hardcoded X button (lines 46-49) that doesn't receive any `disabled` prop. We need to modify it to accept an optional `disabled` prop that gets passed to the X button.

**Change AlertDialogContent to accept disabled prop (Lines 31-52):**

```tsx
const AlertDialogContent = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content> & {
    disableClose?: boolean;
  }
>(({ className, children, disableClose, ...props }, ref) => (
  <AlertDialogPortal>
    <AlertDialogOverlay />
    <AlertDialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] border bg-background px-6 py-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className
      )}
      {...props}
    >
      {children}
      <AlertDialogPrimitive.Cancel 
        disabled={disableClose}
        className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[state=open]:bg-accent data-[state=open]:text-muted-foreground z-10"
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </AlertDialogPrimitive.Cancel>
    </AlertDialogPrimitive.Content>
  </AlertDialogPortal>
))
```

---

### Then update AssignVideosModal to use the new prop

**Unassign Dialog (Line 670):**
```tsx
<AlertDialogContent disableClose={isSubmitting}>
```

**Due Date Dialog (Line 693):**
```tsx
<AlertDialogContent className="sm:max-w-md" disableClose={isSubmitting}>
```

---

### Expected Result

| State | X Button Behavior |
|-------|-------------------|
| Before submitting | X closes dialog normally |
| During submission | X is visually disabled and unclickable |
| After submission | Dialog closes automatically via code |

---

### Why This Works

- The `disableClose` prop prevents users from clicking X while an action is in progress
- This matches the behavior of the Cancel and Action buttons in the footer
- The visual feedback (opacity change) tells users the button is temporarily disabled
- No functional changes to the dialog workflow - just prevents premature closing

