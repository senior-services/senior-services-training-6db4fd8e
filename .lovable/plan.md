

## Fix Ghost Button Hover Text on Dark Headers

### Problem
`.button-ghost` and `.button-ghost-dark` sit at the same specificity level in `src/index.css`. The `hover:text-primary` from `.button-ghost` overrides `hover:text-current` from `.button-ghost-dark`, turning text dark on hover -- invisible against navy/purple headers.

### Solution (Option B -- Scoped CSS Cascade)

**`src/index.css` (line 265-267)** -- Replace the flat `@apply` with a properly scoped rule:

```css
.button-ghost-dark {
  @apply shadow-none;
}
.button-ghost-dark:hover {
  --tw-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  background-color: rgb(255 255 255 / 0.1);
  color: inherit;
}
```

The separate `.button-ghost-dark:hover` selector is more specific than the `@apply hover:text-primary` expansion inside `.button-ghost`, so it naturally wins the cascade without `!important`.

**No changes needed** in `Header.tsx` or `ComponentsGallery.tsx` -- both already apply `button-ghost-dark` correctly.

### Also in this pass

**`src/components/Header.tsx` (line 50)** -- Downsize header title typography per the previously approved but unimplemented change:

```
text-h4  -->  text-body
```

### Review
1. **Top 3 Risks:** (a) The explicit `:hover` pseudo-class selector has higher specificity than Tailwind's `@apply hover:` expansion -- this is the intended behavior. (b) Shadow value hardcoded to match `shadow-md` -- acceptable since it mirrors the existing token. (c) `color: inherit` keeps text color from parent context (white).
2. **Top 3 Fixes:** (a) Text stays white on hover. (b) No `!important` used. (c) Uses natural CSS cascade per best practices.
3. **Database Change:** No.
4. **Verdict:** Go -- two surgical edits, no component API changes.
