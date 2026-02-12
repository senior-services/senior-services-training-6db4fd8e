

## Total Search-and-Destroy: Eliminate Utility Stacking Across All UI Primitives

### Problem

The previous refactor *added* semantic class names but *left* the old Tailwind utility strings in place, resulting in "stacking" -- e.g., `button.tsx` line 8 reads `"button-base inline-flex items-center justify-center gap-2 ..."` with 15+ utilities after the semantic class. The CSS class is present but decorative; the actual styling still comes from inline utilities.

---

### Phase 1: Absorb All Utilities into Global CSS Classes (`src/index.css`)

Move every utility string from the component CVA base into the corresponding CSS class. After this, each CSS class becomes the **complete** definition.

**`.button-base`** (currently only has min-height, padding, font-size):
```css
.button-base {
  @apply inline-flex items-center justify-center gap-2 whitespace-nowrap
    rounded-md font-medium ring-offset-background transition-all duration-200
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
    focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50
    shadow-md hover:shadow-lg;
  @apply [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0;
  min-height: 44px;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  active: scale-[0.98]; /* via @apply active:scale-[0.98] */
}
```

**`.button-compact`** (absorb Radix form control resets -- stays minimal).

**`.button-toggle`** (absorb toggle.tsx utilities):
```css
.button-toggle {
  @apply inline-flex items-center justify-center rounded-md text-small
    font-medium ring-offset-background transition-colors
    hover:bg-muted hover:text-muted-foreground
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
    focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50
    data-[state=on]:bg-accent data-[state=on]:text-accent-foreground w-fit;
  min-height: auto;
  padding: 0;
  font-size: inherit;
  box-sizing: border-box;
  margin: 0;
}
```

**`.input-base`** (new -- absorb input.tsx utilities):
```css
.input-base {
  @apply flex h-10 w-full rounded-md border border-input bg-background
    px-3 py-2 ring-offset-background
    file:border-0 file:bg-transparent file:font-medium file:text-foreground
    placeholder:text-muted-foreground
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
    focus-visible:ring-offset-2
    disabled:cursor-not-allowed disabled:opacity-50;
}
```

**`.card-base`** (new -- absorb card.tsx utilities):
```css
.card-base {
  @apply rounded-lg border border-border-primary bg-card
    text-card-foreground shadow-card;
}
```

**`.badge-base`** stays as-is (already correct from previous pass).

---

### Phase 2: Strip Utility Strings from Component Files

Each component's CVA base string (or inline className) becomes the semantic class name only.

| File | Before (CVA base / className) | After |
|---|---|---|
| `button.tsx` (line 8) | `"button-base inline-flex items-center ... active:scale-[0.98]"` | `"button-base"` |
| `toggle.tsx` (line 8) | `"button-toggle inline-flex items-center ... w-fit"` | `"button-toggle"` |
| `input.tsx` (line 11) | `"flex h-10 w-full rounded-md border ..."` | `"input-base"` |
| `card.tsx` (line 12) | `"rounded-lg border border-border-primary ..."` | `"card-base"` |
| `badge.tsx` | `"badge-base"` | No change (already clean) |

---

### Phase 3: Table Component Cleanup

`table.tsx` sub-components have layout utilities (not a "primitive shape" like button/badge), so they stay as utility strings. However, `TableHead` on line 83 has `text-small` which is correct semantic usage -- no changes needed here.

---

### Phase 4: Header Verification

`Header.tsx` is already clean:
- Line 30: `<h1 className="text-h3 text-primary-foreground">` -- `text-h3` is semantic, `text-primary-foreground` is a color (not a font-size). No issues.

---

### Phase 5: Final text-xs/text-sm Sweep

Search confirms zero `text-sm` or `text-xs` remain in `.tsx` files. All 1003 matches from the search are `text-small` or `text-caption` -- our semantic classes. The refactor from the previous pass is confirmed complete.

---

### Phase 6: Update Style Guide Master Templates

Update `ComponentsGallery.tsx` (lines 707-734) to show the **full** `.button-base` definition (with all absorbed utilities) instead of the current abbreviated version. Add `.input-base` and `.card-base` to the Master Templates grid. Label all four as "Single Source of Truth."

---

### Files Changed Summary

| File | Change |
|---|---|
| `src/index.css` | Expand `.button-base` and `.button-toggle` with absorbed utilities; add `.input-base` and `.card-base` |
| `src/components/ui/button.tsx` | CVA base: `"button-base"` (strip ~15 utilities) |
| `src/components/ui/toggle.tsx` | CVA base: `"button-toggle"` (strip ~12 utilities) |
| `src/components/ui/input.tsx` | className: `"input-base"` (strip ~10 utilities) |
| `src/components/ui/card.tsx` | Card className: `"card-base"` (strip 5 utilities) |
| `src/pages/ComponentsGallery.tsx` | Expand Master Templates to show all 4 base classes with full definitions |

**Total: 6 files**

---

### Review

1. **Top 3 Risks:** (1) Moving all button utilities into CSS means CVA's `cn()` merge can no longer override base layout properties like `gap-2` or `rounded-md` via className -- but no variant currently does this, so this is safe. (2) The `active:scale-[0.98]` arbitrary value must be tested in `@apply` syntax. (3) `input-base` absorbs `h-10` which may conflict with the global `input { min-height: 44px }` rule on line 188 -- h-10 is 40px vs 44px. Resolution: remove `h-10` from `.input-base` and let the global rule control height.
2. **Top 3 Fixes:** (1) Eliminates all utility stacking -- each component references exactly one semantic class. (2) CSS becomes the true single source of truth for all primitive shapes. (3) Style Guide documents the complete definitions.
3. **Database Change:** No
4. **Verdict:** Go -- this completes the "CSS as the Brain" mandate.

