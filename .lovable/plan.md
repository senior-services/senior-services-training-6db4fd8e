

## Add Dropdown Ghost Variant to Style Guide and Header

### Changes

**1. `src/pages/ComponentsGallery.tsx` -- Add ghost dropdown example (after line 1730)**

Insert a new dropdown example next to the existing "Dropdown Menu" that uses `Button variant="ghost"` as trigger with a `ChevronDown` icon. This demonstrates the ghost dropdown pattern -- text label with a down caret, no border or background until hovered.

```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost">
      Options <ChevronDown className="w-4 h-4 ml-2" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem><User className="w-4 h-4 mr-2" />Profile</DropdownMenuItem>
    <DropdownMenuItem><Settings className="w-4 h-4 mr-2" />Settings</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

**2. `src/components/Header.tsx` -- Update user dropdown trigger (lines 69-75)**

- Remove the user icon circle (the `div` with the `User` icon on lines 71-73).
- Replace the custom `<button>` with `<Button variant="ghost">` using the `ChevronDown` icon after the user name.
- Add header-appropriate text color classes so the ghost button text is white on both navy and purple backgrounds.

Updated trigger:
```tsx
<Button variant="ghost" className={`${headerTextColor} hover:bg-white/10`}>
  {userName} <ChevronDown className="w-4 h-4 ml-2" />
</Button>
```

### Technical Details

- `ChevronDown` is already imported in `ComponentsGallery.tsx` (line 34). It needs to be added to the import in `Header.tsx` (replacing `User` which is no longer needed).
- The ghost variant already exists in the button system (`button-ghost` class in `index.css`). No new CSS tokens needed.
- The `hover:bg-white/10` override on the header button provides a subtle hover effect appropriate for dark header backgrounds, without conflicting with the standard ghost hover style.

### Review
1. **Top 3 Risks:** (a) Ghost hover on dark background needs white/10 overlay instead of default muted -- handled via className override. (b) `User` icon removal is intentional per request. (c) No accessibility regression -- button still has visible text and focus ring.
2. **Top 3 Fixes:** (a) Cleaner header with less visual clutter. (b) Style guide documents the ghost dropdown pattern. (c) Consistent use of Button component instead of raw `<button>`.
3. **Database Change:** No.
4. **Verdict:** Go -- uses existing ghost variant, minimal changes.

