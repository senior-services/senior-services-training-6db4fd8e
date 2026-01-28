

## Update Font Size Labels in Component Gallery

### Overview
Update the typography section labels in ComponentsGallery.tsx to accurately reflect the custom senior-accessible font sizes defined in tailwind.config.ts.

---

### Changes to Make

**File: `src/pages/ComponentsGallery.tsx`**

| Line | Current Text | Updated Text |
|------|--------------|--------------|
| 182 | Extra small text (12px) | Extra small text (14px) |
| 183 | Small text (14px) | Small text (15px) |
| 189 | Code snippet (14px) | Code snippet (15px) |

---

### Technical Details

Three label updates in the typography section:

1. **Line 182** - Change `(12px)` to `(14px)` for `text-xs` class
2. **Line 183** - Change `(14px)` to `(15px)` for `text-sm` class  
3. **Line 189** - Change `(14px)` to `(15px)` for code snippet using `text-sm` class

---

### Result
The Component Gallery will display accurate font size documentation matching the project's tailwind.config.ts settings.

