

## Zero-Exception Final Typography Refactor

### Summary

This is the final, absolute cleanup. After this pass, zero Tailwind font-size utility strings (`text-xs`, `text-sm`, `text-base`, `text-lg`, etc.) will remain in any `.tsx` file. Additionally, `.btn-base` is renamed to `.button-base`, `.badge-base` is created as the single source of truth for badge shape, and the Style Guide is updated to document both as "Master Templates."

---

### 1. Rename `.btn-base` to `.button-base` (2 files)

**`src/index.css`** (line 196):
- Rename `.btn-base` to `.button-base`
- Also rename `.btn-compact` to `.button-compact` and `.btn-toggle` to `.button-toggle` for consistency
- Update all `@apply` references: the Radix reset selector on line 246 changes from `@apply btn-compact` to `@apply button-compact`

**`src/components/ui/button.tsx`** (line 8):
- Change `btn-base` to `button-base` in the CVA base string

**`src/components/ui/toggle.tsx`** (line 8):
- Change `btn-toggle` to `button-toggle` in the CVA base string

---

### 2. Create `.badge-base` and Refactor `badge.tsx` (2 files)

**`src/index.css`** -- Add new class after `.button-toggle`:
```css
.badge-base {
  @apply inline-flex items-center rounded-full border px-2.5 py-0.5 text-caption font-semibold transition-all duration-200 whitespace-nowrap;
  @apply focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2;
}
```

**`src/components/ui/badge.tsx`** (line 8):
- Replace the long inline utility string with `badge-base`:
```
Before: "inline-flex items-center rounded-full border px-2.5 py-0.5 text-caption font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 whitespace-nowrap"
After:  "badge-base"
```
- CVA now references the global CSS class as its single source of truth

---

### 3. Replace ALL 60 `text-xs` Instances with `text-caption` (9 files)

Every single `text-xs` becomes `text-caption`. No exceptions.

| File | Instances | Context |
|---|---|---|
| `chart.tsx` | 2 | Recharts container + tooltip content |
| `command.tsx` | 2 | Group heading selector + shortcut span |
| `context-menu.tsx` | 1 | Shortcut span |
| `dropdown-menu.tsx` | 1 | Shortcut span |
| `menubar.tsx` | 1 | Shortcut span |
| `AddContentModal.tsx` | 1 | Character count |
| `AuthErrorBoundary.tsx` | 1 | Dev-only details |
| `error-boundary.tsx` | 2 | Dev-only details + fallback error |
| `ErrorBoundary.tsx` | 1 | Dev-only pre |

---

### 4. Fix `.status-badge` in `src/index.css` (line 276)

Replace `text-sm` with `text-small` in the `@apply` directive.

---

### 5. Remove `text-base` from body in `src/index.css` (line 167)

The `text-base` Tailwind utility on the `body` tag is redundant because `font-size: 1rem` is explicitly set on line 169. Remove `text-base` from the `@apply` directive to eliminate the last hardcoded Tailwind font-size utility from CSS.

---

### 6. Update Style Guide -- Master Templates Section (ComponentsGallery.tsx)

Add a new "Master Templates" subsection inside the Typography Utility Classes card (after the Semantic vs Visual Example block, around line 705). This section will document:

- **`.button-base`**: Shows the consolidated properties (min-height: 44px, padding, font-size: 1rem) and notes that `button.tsx` CVA references this class.
- **`.badge-base`**: Shows the consolidated properties (inline-flex, items-center, rounded-full, border, px-2.5, py-0.5, text-caption, font-semibold) and notes that `badge.tsx` CVA references this class.
- Both are labeled as **"Master Templates -- Single Source of Truth for all UI primitives."**

Uses a two-column card layout with code blocks showing the class definitions.

---

### Files Changed Summary

| File | Changes |
|---|---|
| `src/index.css` | Rename `.btn-*` to `.button-*`; add `.badge-base`; fix `.status-badge`; remove `text-base` from body |
| `src/components/ui/button.tsx` | `btn-base` to `button-base` |
| `src/components/ui/toggle.tsx` | `btn-toggle` to `button-toggle` |
| `src/components/ui/badge.tsx` | CVA base string to `badge-base` |
| `src/components/ui/chart.tsx` | `text-xs` to `text-caption` (2 instances) |
| `src/components/ui/command.tsx` | `text-xs` to `text-caption` (2 instances) |
| `src/components/ui/context-menu.tsx` | `text-xs` to `text-caption` |
| `src/components/ui/dropdown-menu.tsx` | `text-xs` to `text-caption` |
| `src/components/ui/menubar.tsx` | `text-xs` to `text-caption` |
| `src/components/ui/error-boundary.tsx` | `text-xs` to `text-caption` (2 instances) |
| `src/components/ui/ErrorBoundary.tsx` | `text-xs` to `text-caption` |
| `src/components/auth/AuthErrorBoundary.tsx` | `text-xs` to `text-caption` |
| `src/components/content/AddContentModal.tsx` | `text-xs` to `text-caption` |
| `src/pages/ComponentsGallery.tsx` | Add Master Templates section |

**Total: 14 files, ~20 targeted edits**

---

### Review

1. **Top 3 Risks:** (1) Renaming `.btn-base` to `.button-base` touches the button CVA and the Radix data-attribute resets -- must update all three references or buttons break. (2) Replacing `text-xs` in `chart.tsx` with `text-caption` -- since both resolve to 0.64rem, this is safe, but Recharts uses Tailwind's raw value; the semantic class must still generate the same CSS output. (3) `badge-base` as a CVA base string must not conflict with CVA's `cn()` merge behavior.
2. **Top 3 Fixes:** (1) Zero hardcoded Tailwind font-size utilities remain in any file. (2) CSS is the single source of truth for button and badge shape. (3) Style Guide documents the Master Templates for future developers.
3. **Database Change:** No
4. **Verdict:** Go -- final zero-exception refactor.

