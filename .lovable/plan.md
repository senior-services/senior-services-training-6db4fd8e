

## Hard Reset: Absorb ALL CVA Variant Utilities into Global CSS

### Problem

The CVA **base** strings are clean (`"button-base"`, `"badge-base"`, etc.), but every **variant** and **size** still outputs raw Tailwind utilities into the rendered HTML. A default button currently renders as:

```
button-base bg-primary text-primary-foreground hover:bg-primary/80 h-10 px-4 py-2
```

That's 9+ classes. The target is 3: `button-base button-default button-md`.

---

### Phase 1: Button Variant + Size Classes in `src/index.css`

Add semantic CSS classes for every button variant and size:

```css
/* Button Color Variants */
.button-default     { @apply bg-primary text-primary-foreground hover:bg-primary/80; }
.button-destructive { @apply bg-destructive text-destructive-foreground hover:bg-destructive/80; }
.button-outline     { @apply border border-input bg-background hover:bg-muted hover:text-primary; }
.button-secondary   { @apply bg-secondary text-secondary-foreground hover:bg-secondary/80; }
.button-ghost       { @apply shadow-none hover:shadow-md hover:bg-muted hover:text-primary; }
.button-link        { @apply shadow-none hover:shadow-none text-primary underline-offset-4 hover:underline active:scale-100; }

/* Button Sizes */
.button-size-default { @apply h-10 px-4 py-2; }
.button-size-sm      { @apply h-9 rounded-md px-3; }
.button-size-lg      { @apply h-11 rounded-md px-8; }
.button-size-icon    { @apply h-10 w-10; }
```

Then in `button.tsx`, the CVA becomes:

```tsx
const buttonVariants = cva("button-base", {
  variants: {
    variant: {
      default: "button-default",
      destructive: "button-destructive",
      outline: "button-outline",
      secondary: "button-secondary",
      ghost: "button-ghost",
      link: "button-link",
    },
    size: {
      default: "button-size-default",
      sm: "button-size-sm",
      lg: "button-size-lg",
      icon: "button-size-icon",
    },
  },
  defaultVariants: { variant: "default", size: "default" },
});
```

**Rendered HTML result:** `button-base button-default button-size-default` (3 classes).

---

### Phase 2: Badge Variant Classes in `src/index.css`

Add semantic CSS classes for all 28 badge variants:

```css
/* Badge Solid Variants */
.badge-default       { @apply border-transparent bg-primary text-primary-foreground; }
.badge-secondary     { @apply border-transparent bg-secondary text-secondary-foreground; }
.badge-tertiary      { @apply border-transparent bg-muted-foreground text-white; }
.badge-destructive   { @apply border-transparent bg-destructive text-destructive-foreground; }
.badge-success       { @apply border-transparent bg-success text-success-foreground; }
.badge-warning       { @apply border-transparent bg-warning text-warning-foreground; }
.badge-attention     { @apply border-transparent bg-attention text-attention-foreground; }
/* Badge Hollow Variants */
.badge-hollow-primary     { @apply border-primary text-primary bg-background; }
.badge-hollow-secondary   { @apply border-secondary text-secondary bg-background; }
/* ... (all 7 hollow + 7 ghost + 7 soft variants) */
```

Then in `badge.tsx`:

```tsx
const badgeVariants = cva("badge-base", {
  variants: {
    variant: {
      default: "badge-default",
      secondary: "badge-secondary",
      // ... all 28 map to their CSS class
    },
  },
});
```

**Rendered HTML result:** `badge-base badge-success` (2 classes).

---

### Phase 3: Toggle Variant + Size Classes in `src/index.css`

```css
/* Toggle Variants */
.toggle-default  { @apply bg-transparent; }
.toggle-outline  { @apply border border-input bg-transparent hover:bg-accent hover:text-accent-foreground; }
.toggle-pill     { @apply bg-transparent rounded-full hover:bg-white/60
                     data-[state=on]:bg-white data-[state=on]:text-gray-900
                     data-[state=on]:font-semibold data-[state=on]:shadow-sm
                     transition-all duration-200 h-8 px-4; }

/* Toggle Sizes */
.toggle-size-default { @apply h-10 px-6; }
.toggle-size-sm      { @apply h-9 px-2.5; }
.toggle-size-lg      { @apply h-11 px-5; }
.toggle-size-pill    { @apply h-8 px-4; }
```

Then in `toggle.tsx`:

```tsx
const toggleVariants = cva("button-toggle", {
  variants: {
    variant: {
      default: "toggle-default",
      outline: "toggle-outline",
      pill: "toggle-pill",
    },
    size: {
      default: "toggle-size-default",
      sm: "toggle-size-sm",
      lg: "toggle-size-lg",
      pill: "toggle-size-pill",
    },
  },
});
```

---

### Phase 4: Header and EmployeeDashboard Verification

Both files are **already clean** -- no changes needed:

- `Header.tsx` line 30: `<h1 className="text-h3 text-primary-foreground">` -- `text-h3` is semantic, `text-primary-foreground` is a color token (not a font-size override). This is correct.
- `EmployeeDashboard.tsx`: Uses `text-h2`, `text-h3`, `text-small` -- all semantic classes. No `text-xl`/`text-sm`/`text-lg` present.

---

### Phase 5: Style Guide Update (`ComponentsGallery.tsx`)

Update the Master Templates section (lines 707-760) to:
1. Show the **clean CVA pattern** -- e.g., `variant: { default: "button-default" }` instead of utility strings.
2. Add the full list of variant CSS classes beneath each Master Template.
3. Ensure all `<pre>` and `<code>` blocks use `.text-code` (0.9375rem / 15px) -- already in place.

---

### Files Changed Summary

| File | Change |
|---|---|
| `src/index.css` | Add ~45 new CSS classes: 6 button variants, 4 button sizes, 28 badge variants, 3 toggle variants, 4 toggle sizes |
| `src/components/ui/button.tsx` | Replace 6 variant utility strings + 4 size utility strings with semantic class names |
| `src/components/ui/badge.tsx` | Replace 28 variant utility strings with semantic class names |
| `src/components/ui/toggle.tsx` | Replace 3 variant utility strings + 4 size utility strings with semantic class names |
| `src/pages/ComponentsGallery.tsx` | Update Master Templates to show clean CVA + variant class definitions |

### Review

1. **Top 3 Risks:** (1) Badge has 28 variants -- that's 28 new CSS classes. High volume but each is a simple 2-3 property declaration. (2) CVA's `cn()` merge uses Tailwind-merge which resolves conflicts by class name; semantic class names (e.g., `.button-default`) won't conflict with each other, so this is safe. (3) Any consumer passing raw Tailwind color overrides via className will now need `!important` or a more specific selector to override the CSS-defined variant -- but this is the desired behavior (CSS as source of truth).
2. **Top 3 Fixes:** (1) Rendered HTML drops from 10+ classes to 2-3 per element. (2) Every visual property lives in CSS -- zero utility strings in component files. (3) Future theme changes require editing only `index.css`.
3. **Database Change:** No
4. **Verdict:** Go -- this completes the hard reset.
