

## Fix Close Button Vertical Alignment in Fullscreen Dialog

### Summary

Update the close button positioning in `FullscreenDialogContent` from `top-2` to `top-4` so it aligns vertically with the header title text.

---

### The Change

**File:** `src/components/ui/dialog.tsx`

**Line 69 - Current:**
```tsx
<DialogPrimitive.Close className="absolute right-2 top-2 rounded-sm opacity-70 ...">
```

**Line 69 - Updated:**
```tsx
<DialogPrimitive.Close className="absolute right-2 top-4 rounded-sm opacity-70 ...">
```

---

### Why This Works

| Element | Spacing |
|---------|---------|
| DialogHeader top padding | `py-4` = 16px |
| Close button position | `top-4` = 16px |
| X icon height | `h-4` = 16px |

The close button will now sit at the same vertical position as the start of the header content, aligning it visually with the title.

