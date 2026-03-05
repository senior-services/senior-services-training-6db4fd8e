

## Add Constrained Compact Banners to Style Guide & Apply to EditVideoModal

### Changes

**1. `src/index.css` — Add new semantic class**

Add a `.banner-size-compact-constrained` class (or `.banner-compact-constrained`) that combines the compact sizing with a `max-width` constraint (e.g., `max-w-md` or `max-w-lg`) and `w-fit` so the banner only takes the width of its content rather than stretching full-width.

```css
.banner-size-compact-constrained {
  @apply py-2 px-3 w-fit max-w-md;
}
```

**2. `src/components/ui/banner.tsx` — Add `constrained` size variant**

Add a new size variant `"compact-constrained"` to the `bannerVariants` CVA config:

```ts
size: {
  default: "banner-size-default",
  compact: "banner-size-compact",
  "compact-constrained": "banner-size-compact-constrained",
},
```

**3. `src/pages/ComponentsGallery.tsx` — Add new section after line 1296**

Insert a new "Inline Banners (Compact, Constrained)" section directly below the existing compact section, before the closing `</div>` on line 1297:

```tsx
<Separator className="my-6" />

<h4 className="text-body-sm font-medium text-muted-foreground">Inline Banners (Compact, Constrained)</h4>

<Banner variant="information" size="compact-constrained" description="This field is optional." />
<Banner variant="success" size="compact-constrained" description="All answers saved." />
<Banner variant="warning" size="compact-constrained" description="Changes will take effect immediately." />
<Banner variant="error" size="compact-constrained" description="Please fix the errors above." />
<Banner variant="attention" size="compact-constrained" description="Review pending items before submitting." />
```

**4. `src/components/EditVideoModal.tsx` — Update inline warning (line 1191)**

Change `size="compact"` to `size="compact-constrained"`:

```tsx
<Banner variant="warning" size="compact-constrained">
```

### Files Changed

| File | Change |
|------|--------|
| `src/index.css` | Add `.banner-size-compact-constrained` class |
| `src/components/ui/banner.tsx` | Add `"compact-constrained"` size variant |
| `src/pages/ComponentsGallery.tsx` | Add constrained compact banner examples section |
| `src/components/EditVideoModal.tsx` | Use `compact-constrained` size on inline warning |

### Database Change
**No.**

