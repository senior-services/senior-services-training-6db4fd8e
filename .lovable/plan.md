

## Revert Badge Font Size to 14px (text-xs)

### Issue

The Badge component was recently changed from `text-xs` (14px) to `text-sm` (15px), but this doesn't align with the Component Gallery typography guidelines which specify:

| Font Size Class | Pixel Size | Purpose |
|-----------------|------------|---------|
| `text-xs` | 14px | **Captions and labels** |
| `text-sm` | 15px | Secondary information |
| `text-base` | 16px | Body text |

Badges are labels/tags, so they should use `text-xs` (14px) per the design system.

---

### Change

**File: `src/components/ui/badge.tsx`**

**Line 8** - Change `text-sm` back to `text-xs`:

```tsx
// Current:
const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 whitespace-nowrap",
  // ...
);

// Updated:
const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 whitespace-nowrap",
  // ...
);
```

---

### Result

| Component | Font Size | Pixel Size | Matches Typography Guidelines |
|-----------|-----------|------------|------------------------------|
| Badge | `text-xs` | 14px | Yes - "Captions and labels" |

