

## Remove Three Sections from Style Guide

### What's Being Removed

1. **"Semantic Tag vs. Visual Style"** (lines 685-705) — sub-section inside Typography showing semantic vs. visual heading examples
2. **"Master Templates — Single Source of Truth for UI Primitives"** (lines 707-867) — sub-section inside Typography showing `.button-base`, `.badge-base`, `.input-base`, etc. code snippets
3. **"Component Updates"** card (lines 2146-2155) — standalone Card section with the `ComponentUpdateIndicator` widget

### Changes

| File | Change |
|------|--------|
| `src/pages/ComponentsGallery.tsx` line 27 | Remove `ComponentUpdateIndicator` import (no longer used) |
| `src/pages/ComponentsGallery.tsx` lines 685-867 | Delete the "Semantic Tag vs. Visual Style" and "Master Templates" sub-sections from the Typography card |
| `src/pages/ComponentsGallery.tsx` lines 2146-2155 | Delete the "Component Updates" Card section |

### What Stays

- The Typography Scale table (lines ~620-683) remains untouched
- The Typography Utility Classes section remains untouched
- All other Style Guide sections (Banners, Badges, Buttons, etc.) are unaffected
- The Tooltips section that follows "Component Updates" remains in place

### Review

1. **Top 3 Risks:** (1) None -- pure content removal with no logic dependencies. (2) The `ComponentUpdateIndicator` component file itself is not deleted, only its usage in the gallery. (3) No nav links point to these sub-sections, so no broken anchors.
2. **Top 3 Fixes:** (1) Cleaner Style Guide focused on live component demos rather than documentation prose. (2) Removes ~190 lines of static reference content. (3) Eliminates the unused `ComponentUpdateIndicator` import.
3. **Database Change:** No
4. **Verdict:** Go -- clean removal, zero side effects.

