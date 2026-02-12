

## Phase 1: Major Third Type Scale -- Global Foundation

### Overview

This is Phase 1 of a 3-phase rollout to implement the Major Third (1.250) type scale across the entire application. Phase 1 establishes the global foundation: CSS variables, Tailwind config, and the Typography section of the Components Gallery.

Phases 2 and 3 (UI primitives and app components) will follow in separate implementations after this phase is reviewed.

---

### Major Third Scale Reference

```text
Step       Ratio       Rem         Pixels    Usage
----       -----       ---         ------    -----
h1         3.052       3.052rem    ~49px     Page titles
h2         1.953       1.953rem    ~31px     Section headings
h3         1.563       1.563rem    ~25px     Subsection headings
h4         1.25        1.25rem     20px      Minor headings / Labels
body       1.0         1rem        16px      Body text (Regular/Medium/Bold)
small      0.8         0.8rem      ~13px     Secondary info
caption    0.64        0.64rem     ~10px     Captions and labels
code       0.9375      0.9375rem   15px      Monospace code snippets
```

---

### File Changes

#### 1. `src/index.css` -- Update heading sizes (lines 179-184)

Replace the current heading sizes with the Major Third scale values:

```css
/* Before */
h1 { font-size: 2.25rem; }   /* 36px */
h2 { font-size: 1.875rem; }  /* 30px */
h3 { font-size: 1.5rem; }    /* 24px */
h4 { font-size: 1.25rem; }   /* 20px */
h5 { font-size: 1.125rem; }  /* 18px */
h6 { font-size: 1rem; }      /* 16px */

/* After */
h1 { font-size: 3.052rem; }  /* ~49px - Major Third */
h2 { font-size: 1.953rem; }  /* ~31px */
h3 { font-size: 1.563rem; }  /* ~25px */
h4 { font-size: 1.25rem; }   /* 20px */
h5 { font-size: 1rem; }      /* 16px */
h6 { font-size: 0.8rem; }    /* ~13px */
```

Add semantic text classes to the `@layer components` block:

```css
/* Semantic typography classes -- Major Third (1.250) scale */
.text-body       { font-size: 1rem; line-height: 1.6; }
.text-small      { font-size: 0.8rem; line-height: 1.5; }
.text-caption    { font-size: 0.64rem; line-height: 1.4; }
.text-code       { font-size: 0.9375rem; line-height: 1.5; font-family: ui-monospace, monospace; }
```

Update existing helper/additional text classes to use the new scale:

```css
/* Before */
.form-helper-text     { @apply text-xs text-foreground mt-0 mb-1.5; }
.form-additional-text { @apply text-xs text-muted-foreground italic mt-1.5; }

/* After -- uses 0.8rem (small) instead of text-xs */
.form-helper-text     { font-size: 0.8rem; @apply text-foreground mt-0 mb-1.5; }
.form-additional-text { font-size: 0.8rem; @apply text-muted-foreground italic mt-1.5; }
```

#### 2. `tailwind.config.ts` -- Remap fontSize tokens (lines 21-33)

Remap the Tailwind `fontSize` entries to match the Major Third scale so any remaining utility usage aligns:

```ts
/* Before */
'xs': ['0.875rem', ...],   /* 14px */
'sm': ['0.9375rem', ...],  /* 15px */
'base': ['1rem', ...],     /* 16px */
'lg': ['1.125rem', ...],   /* 18px */
'xl': ['1.25rem', ...],    /* 20px */
'2xl': ['1.5rem', ...],    /* 24px */
'3xl': ['1.875rem', ...],  /* 30px */
'4xl': ['2.25rem', ...],   /* 36px */

/* After -- Major Third aligned */
'xs': ['0.64rem', { lineHeight: '1.4' }],     /* ~10px - caption */
'sm': ['0.8rem', { lineHeight: '1.5' }],      /* ~13px - small */
'base': ['1rem', { lineHeight: '1.6' }],      /* 16px  - body */
'lg': ['1.25rem', { lineHeight: '1.5' }],     /* 20px  - h4 */
'xl': ['1.563rem', { lineHeight: '1.4' }],    /* ~25px - h3 */
'2xl': ['1.953rem', { lineHeight: '1.3' }],   /* ~31px - h2 */
'3xl': ['3.052rem', { lineHeight: '1.2' }],   /* ~49px - h1 */
'4xl': ['3.815rem', { lineHeight: '1.1' }],   /* ~61px - display (reserved) */
```

Also add a `code` size token:

```ts
'code': ['0.9375rem', { lineHeight: '1.5' }], /* 15px - monospace */
```

#### 3. `src/pages/ComponentsGallery.tsx` -- Update Typography section (lines 524-590)

Replace the current Typography showcase with the new scale values and semantic class usage:

- h1: "Heading 1" with annotation "(~49px / 3.052rem)"
- h2: "Heading 2" with annotation "(~31px / 1.953rem)"
- h3: "Heading 3" with annotation "(~25px / 1.563rem)"
- h4: "Heading 4" with annotation "(20px / 1.25rem)"
- Body (Regular, Medium, Bold): annotation "(16px / 1rem)"
- Small (Regular, Medium, Bold): annotation "(~13px / 0.8rem)"
- Caption (Regular, Medium, Bold): annotation "(~10px / 0.64rem)"
- Code snippet: annotation "(15px / 0.9375rem)"

Heading elements will use bare `<h1>` through `<h4>` tags (no `text-*` utility classes), relying on the global CSS rules. Body/small/caption will use the new semantic classes (`.text-body`, `.text-small`, `.text-caption`).

#### 4. `STYLEGUIDE.md` -- Add typography scale documentation

Add a new "Typography Scale" section documenting the Major Third scale values and the semantic CSS classes.

---

### What Stays the Same

- All component files (badge, button, label, tooltip, etc.) are untouched in Phase 1
- All page/dashboard components are untouched in Phase 1
- Color tokens, spacing, and all non-typography CSS remain unchanged
- Dark mode behavior is unaffected

### What Will Break (Temporarily)

Because the Tailwind `text-xs` and `text-sm` tokens will change meaning globally, some components will render at different sizes until Phases 2 and 3 replace those utility classes with semantic alternatives. This is expected and will be resolved in subsequent phases.

---

### Review

1. **Top 3 Risks:** (1) Changing Tailwind `fontSize` tokens globally will immediately affect all 64 files using `text-xs`/`text-sm` -- components will temporarily render at the new (different) sizes until explicitly migrated. (2) The `text-xs` token drops from 14px to ~10px, which could make some UI elements too small for senior users until Phase 2 migrates them. (3) The `text-sm` token drops from 15px to ~13px, affecting Labels, badges, and form descriptions.
2. **Top 3 Fixes:** (1) Establishes a mathematically consistent type scale as the single source of truth. (2) Semantic CSS classes (`.text-body`, `.text-small`, `.text-caption`) decouple intent from arbitrary Tailwind tokens. (3) Typography gallery becomes an accurate reference for the new scale.
3. **Database Change:** No
4. **Verdict:** Go -- foundational change that enables clean migration in Phases 2 and 3.

