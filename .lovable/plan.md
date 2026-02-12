

## Final Purge of Overrides: Audit Report

### Summary

After the previous three rounds of refactoring, the CVA primitives (Button, Badge, Toggle, Banner, Sheet, Toast) are fully semantic. However, **Card sub-components** and **page-level typography** still carry raw Tailwind utilities. This final purge addresses all remaining violations.

---

### Violation Inventory

| # | File | Line(s) | Violation | Type |
|---|------|---------|-----------|------|
| 1 | `card.tsx` | 23 | CardHeader: `"flex flex-col space-y-1.5 p-6"` | Raw layout utilities in component |
| 2 | `card.tsx` | 36 | CardTitle: `"font-semibold leading-none tracking-tight"` | Raw typography utilities |
| 3 | `card.tsx` | 60 | CardContent: `"p-6 pt-0"` | Raw padding |
| 4 | `card.tsx` | 70 | CardFooter: `"flex items-center p-6 pt-0"` | Raw layout + padding |
| 5 | `TrainingCard.tsx` | 307, 324, 343, 358 | `<Badge className="font-medium">` (x4) | Font-weight override on primitive |
| 6 | `TrainingCard.tsx` | 373 | `<CardTitle className="text-h4 leading-tight line-clamp-2">` | `leading-tight` overrides CardTitle's default |
| 7 | `Auth.tsx` | 119 | `<h1 className="text-h2 font-bold text-white mb-2">` | `font-bold` on heading |
| 8 | `Auth.tsx` | 147 | `<div className="mb-6 p-4 banner-base banner-attention">` | `p-4` internal padding alongside banner classes |
| 9 | `Auth.tsx` | 149 | `<h3 className="font-semibold text-attention text-small">` | `font-semibold` on heading |
| 10 | `Landing.tsx` | 19 | `<h1 className="font-bold text-white mb-4">` | `font-bold` on heading |
| 11 | `VideoPage.tsx` | 232 | `<CardContent className="p-6 relative">` | Redundant `p-6` (same as default) |
| 12 | `VideoPage.tsx` | 332 | `<h3 className="text-h4 font-semibold">` | `font-semibold` on heading |
| 13 | `EmployeeManagement.tsx` | 624-625 | `<TableHead className="px-4 py-3 text-small font-medium uppercase text-muted-foreground">` | Padding + font overrides on primitive |
| 14 | `EmployeeManagement.tsx` | 630, 638, 641 | `<TableCell className="py-3 ...">` | Padding overrides on primitive |
| 15 | `EmployeeDashboard.tsx` | 501, 544, 567, 624 | `font-bold`/`font-semibold` on h1/h2 tags | Font-weight overrides |
| 16 | `EmployeeManagement.tsx` | 670 | `<span className="text-h4 font-semibold">` | `font-semibold` on heading-styled span |

---

### Remediation Plan

#### Phase 1: Absorb Card Sub-Component Utilities into `src/index.css`

Add semantic classes for Card's internal components. This is the same pattern used for Button/Badge -- move raw utilities to CSS.

```css
/* Card Sub-Component Templates */
.card-header  { @apply flex flex-col space-y-1.5 p-6; }
.card-title   { @apply font-semibold leading-none tracking-tight; }
.card-description { @apply text-small text-muted-foreground; }
.card-content { @apply p-6 pt-0; }
.card-footer  { @apply flex items-center p-6 pt-0; }
```

Then strip the raw utilities from `card.tsx`:
- CardHeader: `cn("flex flex-col space-y-1.5 p-6", className)` becomes `cn("card-header", className)`
- CardTitle: `cn("font-semibold leading-none tracking-tight", className)` becomes `cn("card-title", className)`
- CardDescription: `cn("text-small text-muted-foreground", className)` becomes `cn("card-description", className)`
- CardContent: `cn("p-6 pt-0", className)` becomes `cn("card-content", className)`
- CardFooter: `cn("flex items-center p-6 pt-0", className)` becomes `cn("card-footer", className)`

#### Phase 2: Bake Font-Weight into Typography Scale in `src/index.css`

Add `font-weight` to all heading definitions so page-level `font-bold`/`font-semibold` becomes unnecessary:

```css
.text-h1 { font-size: 3.052rem; line-height: 1.2; font-weight: 700; }
.text-h2 { font-size: 1.953rem; line-height: 1.3; font-weight: 700; }
.text-h3 { font-size: 1.563rem; line-height: 1.4; font-weight: 600; }
.text-h4 { font-size: 1.25rem;  line-height: 1.5; font-weight: 600; }
```

Also add base heading tag rules so raw `<h1>`-`<h4>` tags inherit weight:

```css
h1 { font-weight: 700; }
h2 { font-weight: 700; }
h3 { font-weight: 600; }
h4 { font-weight: 600; }
```

#### Phase 3: Add Table Head/Cell Semantic Class in `src/index.css`

To eliminate the repeated `px-4 py-3 text-small font-medium uppercase text-muted-foreground` pattern on TableHead:

```css
.table-head-cell { @apply px-4 py-3 text-small font-medium uppercase text-muted-foreground; }
.table-body-cell { @apply py-3; }
```

#### Phase 4: Strip Overrides from Page-Level Files

**`TrainingCard.tsx`:**
- Lines 307, 324, 343, 358: Remove `className="font-medium"` from all four Badge instances (Badge's font-size is already defined in `.badge-base`)
- Line 373: Change `className="text-h4 leading-tight line-clamp-2"` to `className="text-h4 line-clamp-2"` (remove `leading-tight` -- `text-h4` already defines `line-height: 1.5`)

**`Auth.tsx`:**
- Line 119: `<h1 className="text-h2 font-bold text-white mb-2">` becomes `<h1 className="text-h2 text-white mb-2">` (font-weight now baked into `.text-h2`)
- Line 147: `<div className="mb-6 p-4 banner-base banner-attention">` -- the `p-4` fights `.banner-size-default` which applies `p-4` already. Remove the redundant `p-4`: `<div className="mb-6 banner-base banner-attention banner-size-default">`
- Line 149: `<h3 className="font-semibold text-attention text-small">` becomes `<h3 className="text-attention text-small">` (h3 tag now inherits `font-weight: 600`)

**`Landing.tsx`:**
- Line 19: `<h1 className="font-bold text-white mb-4">` becomes `<h1 className="text-white mb-4">` (h1 inherits `font-weight: 700`)

**`VideoPage.tsx`:**
- Line 232: `<CardContent className="p-6 relative">` becomes `<CardContent className="relative">` (p-6 is the default in `.card-content`)
- Line 332: `<h3 className="text-h4 font-semibold">` becomes `<h3 className="text-h4">` (h3 inherits `font-weight: 600`)

**`EmployeeManagement.tsx`:**
- Line 624: `<TableHead className="px-4 py-3 text-small font-medium uppercase text-muted-foreground">` becomes `<TableHead className="table-head-cell">`
- Line 625: Same treatment
- Lines 630, 638, 641: `<TableCell className="py-3 ...">` becomes `<TableCell className="table-body-cell ...">` (keeping non-padding classes like `font-medium` or `text-right`)
- Line 670: `<span className="text-h4 font-semibold">` becomes `<span className="text-h4">` (font-weight baked into `.text-h4`)

**`EmployeeDashboard.tsx`:**
- Line 501: `<h2 ... className="font-semibold mb-2">` becomes `<h2 ... className="mb-2">`
- Line 544: `<h1 ... className="text-h2 font-bold text-foreground">` becomes `<h1 ... className="text-h2 text-foreground">`
- Line 567: `<h2 ... className="text-h3 font-semibold text-foreground ...">` becomes `<h2 ... className="text-h3 text-foreground ...">`
- Line 624: `<h2 className="text-h3 font-semibold text-foreground ...">` becomes `<h2 className="text-h3 text-foreground ...">`

---

### Files Changed Summary

| File | Change |
|---|---|
| `src/index.css` | Add `.card-header`, `.card-title`, `.card-description`, `.card-content`, `.card-footer`, `.table-head-cell`, `.table-body-cell`; add `font-weight` to `.text-h1`-`.text-h4` and `h1`-`h4` tags |
| `src/components/ui/card.tsx` | Replace all raw utility strings with semantic class names |
| `src/components/TrainingCard.tsx` | Remove `font-medium` from 4 Badge classNames; remove `leading-tight` from CardTitle |
| `src/pages/Auth.tsx` | Remove `font-bold`, `font-semibold`, redundant `p-4` |
| `src/pages/Landing.tsx` | Remove `font-bold` from h1 |
| `src/pages/VideoPage.tsx` | Remove redundant `p-6` and `font-semibold` |
| `src/components/dashboard/EmployeeManagement.tsx` | Replace TableHead/Cell padding overrides with semantic classes; remove `font-semibold` |
| `src/pages/EmployeeDashboard.tsx` | Remove `font-bold`/`font-semibold` from all headings |

**Total: 8 files**

---

### Review

1. **Top 3 Risks:** (1) Adding `font-weight` to the global `h1`-`h4` tags affects every heading in the app -- but this is the desired behavior since we want the CSS to be the single source of truth. (2) CardTitle already renders as `<h3>`, so adding `font-weight: 600` to both `h3` and `.card-title` is redundant but harmless (CSS cascade). (3) Removing `leading-tight` from TrainingCard's CardTitle changes its line-height from 1.25 to the `.card-title` default of `leading-none` (1.0) -- the `text-h4` class will then apply `line-height: 1.5`, which is the correct scale value.
2. **Top 3 Fixes:** (1) Card sub-components join Button/Badge/Banner as fully semantic -- rendered HTML shows `card-header`, `card-title`, etc. instead of raw utilities. (2) Font-weight is now baked into the typography scale, eliminating the most common page-level override across the entire codebase. (3) Table styling is standardized via `.table-head-cell` and `.table-body-cell`.
3. **Database Change:** No
4. **Verdict:** Go -- this is the final purge to achieve 100% compliance.

