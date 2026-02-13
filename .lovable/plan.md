

## Update Typography Scale: Major Third (1.250) to Major Second (1.125)

### New Scale (from reference image)

| Step | Old (1.250) | New (1.125) | Semantic Class | Usage |
|------|-------------|-------------|----------------|-------|
| h1 | 3.052rem (~49px) | 2.027rem (~32px) | `.text-h1` / `h1` | Page titles |
| h2 | 1.953rem (~31px) | 1.802rem (~29px) | `.text-h2` / `h2` | Section headings |
| h3 | 1.563rem (~25px) | 1.602rem (~26px) | `.text-h3` / `h3` | Subsection headings |
| h4 | 1.25rem (20px) | 1.424rem (~23px) | `.text-h4` / `h4` | Minor headings |
| h5 | 1rem (16px) | 1.266rem (~20px) | `h5` | Sub-labels |
| h6 | 0.8rem (~13px) | 1.125rem (18px) | `h6` | Smallest heading |
| body | 1rem (16px) | 1rem (16px) | `.text-body` | Body text (unchanged) |
| small | 0.8rem (~13px) | 0.889rem (~14px) | `.text-small` | Secondary info |
| caption | 0.64rem (~10px) | 0.79rem (~13px) | `.text-caption` | Captions |
| code | 0.9375rem (15px) | 0.9375rem (15px) | `.text-code` | Monospace (unchanged) |

### Summary of Impact

The new scale is significantly more compact at the top (h1 drops from 49px to 32px) and slightly larger at the bottom (small goes from 13px to 14px, caption from 10px to 13px). This improves overall legibility uniformity while reducing visual weight on page titles.

### Files to Edit

**1. `tailwind.config.ts`** -- Update the `fontSize` map (lines 21-31)

New values:
```text
xs:   0.79rem   (caption, ~13px)
sm:   0.889rem  (small, ~14px)
base: 1rem      (body, 16px) -- unchanged
lg:   1.424rem  (h4, ~23px)
xl:   1.602rem  (h3, ~26px)
2xl:  1.802rem  (h2, ~29px)
3xl:  2.027rem  (h1, ~32px)
4xl:  2.281rem  (display, ~37px) -- one step above h1
code: 0.9375rem (unchanged)
```

**2. `src/index.css`** -- All hardcoded `font-size` values updated to new scale

Locations and changes:

| Line(s) | Selector | Old Value | New Value |
|---------|----------|-----------|-----------|
| 185 | `h1` | 3.052rem | 2.027rem |
| 190 | `h2` | 1.953rem | 1.802rem |
| 194 | `h3` | 1.563rem | 1.602rem |
| 198 | `h4` | 1.25rem | 1.424rem |
| 202 | `h5` | 1rem | 1.266rem |
| 206 | `h6` | 0.8rem | 1.125rem |
| 515 | `.text-h1` | 3.052rem | 2.027rem |
| 520 | `.text-h2` | 1.953rem | 1.802rem |
| 525 | `.text-h3` | 1.563rem | 1.602rem |
| 530 | `.text-h4` | 1.25rem | 1.424rem |
| 540 | `.text-small` | 0.8rem | 0.889rem |
| 544 | `.tooltip-content` | 0.8rem | 0.889rem |
| 548 | `.text-caption` | 0.64rem | 0.79rem |
| 559 | `.form-helper-text` | 0.8rem | 0.889rem |
| 565 | `.form-additional-text` | 0.8rem | 0.889rem |

Body (1rem) and code (0.9375rem) remain unchanged.

**3. `STYLEGUIDE.md`** -- Update scale table and token mapping to reflect new values and "Major Second (1.125)" label.

### Review

1. **Top 3 Risks:** (a) h4 grows from 20px to 23px -- Dialog titles use `.text-h4`, so they will be slightly larger; acceptable. (b) h1 shrinks from 49px to 32px -- page titles will be notably smaller; this is the intended outcome. (c) Small text grows from 13px to 14px -- badges (now `.text-body`) are unaffected, but tooltips and helper text get marginally larger.
2. **Top 3 Fixes:** (a) All hardcoded `font-size` values replaced with new scale -- zero magic numbers remain. (b) Tighter heading scale improves visual hierarchy without extreme size jumps. (c) Small/caption sizes now meet or exceed 13px minimum.
3. **Database Change:** No.
4. **Verdict:** Go -- pure CSS and config change, zero component file edits.
