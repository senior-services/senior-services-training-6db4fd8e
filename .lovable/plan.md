

## Add `text-h3` to Dialog Titles and Strip Inline Overrides

### Problem
`DialogTitle` currently applies `font-semibold leading-loose tracking-tight` inline, which conflicts with the CSS base layer. The user wants dialog titles sized at `text-h3` (25px) rather than the default `h2` size (31px).

### Changes (2 files)

**1. `src/components/ui/dialog.tsx`** -- line 133

| Before | After |
|--------|-------|
| `"font-semibold leading-loose tracking-tight"` | `"text-h3"` |

This applies the 25px scale step and removes `font-semibold` (which was downgrading `h2` weight from 700 to 600), `leading-loose` (line-height 2.0, too tall for seniors), and redundant `tracking-tight`.

**2. `src/components/ui/alert-dialog.tsx`** -- line 94

| Before | After |
|--------|-------|
| `"font-semibold"` | `"text-h3"` |

Keeps `AlertDialogTitle` consistent with `DialogTitle`.

### Result
- **Size**: All dialog titles render at 25px (`text-h3`) instead of 31px
- **Weight**: Inherits 700 from `h2` base rule (was incorrectly 600 via `font-semibold`)
- **Line-height**: Resets from 2.0 to design-system standard (~1.3)
- **Scope**: Applies to all normal, fullscreen, and alert dialogs app-wide via these shared primitives

### Review

1. **Top 3 Risks:** (1) Titles shift from 31px to 25px -- intentional per user request. (2) Weight shifts from 600 to 700 -- correct per `h2` base rule. (3) Zero impact on non-dialog headings.
2. **Top 3 Fixes:** (1) Dialog titles adopt 25px scale step globally. (2) Eliminates three redundant inline utilities. (3) Line-height improves from 2.0 to ~1.3 for senior readability.
3. **Database Change:** No
4. **Verdict:** Go -- two-line change across two files.

