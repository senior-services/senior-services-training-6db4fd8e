

## Fix Ghost Dropdown Hover on Dark Backgrounds

### Problem
The `.button-ghost` CSS rule applies `hover:bg-muted hover:text-primary` (line 263 of `index.css`). On dark header backgrounds, this causes:
1. The hover background to become the light muted color instead of the intended `white/10` overlay.
2. The text to turn dark (`text-primary`), making it invisible against the dark header.

The `className` overrides on the `Button` in `Header.tsx` (`hover:bg-white/10`) lose the specificity battle against the base `.button-ghost` `@apply` directives.

### Changes

**1. `src/index.css` (line 263) -- Add dark-surface ghost modifier**

Add a new utility class `.button-ghost-dark` that overrides hover behavior for ghost buttons on dark backgrounds:

```css
.button-ghost-dark {
  @apply shadow-none hover:shadow-md hover:bg-white/10 hover:text-current;
}
```

This keeps the text color as-is (white, inherited from parent) and uses a subtle white overlay for the hover background.

**2. `src/components/Header.tsx` (line 70) -- Use new class**

Replace the inline hover overrides with the semantic class. Remove `hover:bg-white/10` from className since it is now baked into `.button-ghost-dark`. Keep `headerTextColor` for the base text color.

```tsx
<Button variant="ghost" className={`button-ghost-dark ${headerTextColor}`}>
  {userName} <ChevronDown className="w-4 h-4 ml-2" />
</Button>
```

**3. `src/pages/ComponentsGallery.tsx` -- Add ghost dropdown on dark background example**

Add a new example card in the Dropdowns section showing the ghost dropdown on a dark background swatch. This demonstrates the `.button-ghost-dark` pattern:

```tsx
{/* Ghost Dropdown on Dark Background */}
<div className="bg-background-header rounded-lg p-4 inline-block">
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" className="button-ghost-dark text-primary-foreground">
        Options <ChevronDown className="w-4 h-4 ml-2" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent>
      <DropdownMenuItem>Profile</DropdownMenuItem>
      <DropdownMenuItem>Settings</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</div>
```

### Technical Details

- The `.button-ghost-dark` class must appear after `.button-ghost` in `index.css` so its `@apply` directives take precedence in the cascade.
- `hover:text-current` ensures the text color remains whatever was set by the parent context (white on navy, white on purple).
- No changes to the `Button` component variants or `button.tsx` -- this is a CSS-only addition.

### Review
1. **Top 3 Risks:** (a) Cascade order -- `.button-ghost-dark` placed after `.button-ghost` ensures correct override. (b) `text-current` inherits from parent, so it must be set correctly -- already handled by `headerTextColor`. (c) No risk to light-background ghost buttons.
2. **Top 3 Fixes:** (a) Text stays white/visible on hover over dark backgrounds. (b) Hover background uses subtle white overlay instead of opaque muted. (c) Style guide documents the dark-surface pattern.
3. **Database Change:** No.
4. **Verdict:** Go -- targeted CSS addition, no component API changes.

