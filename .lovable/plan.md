

# Plan: Simplify Header Right Side with Review Fixes

## Change

### File: `src/components/Header.tsx`

Replace the dropdown menu section (right side) with an inline layout, incorporating all review feedback.

**Remove imports**: `DropdownMenu`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuTrigger`, `ChevronDown`

**Keep imports**: `Button`, `User`, `LogOut`

**Replace lines 44-71** (the right side section) with:

```tsx
<div className="flex items-center space-x-3">
  <div className="w-8 h-8 rounded-full bg-primary-foreground flex items-center justify-center">
    <User className="w-4 h-4 text-primary" />
  </div>
  <span className="hidden sm:inline text-sm font-medium text-primary-foreground">{userName}</span>
  <span className="text-primary-foreground/40" aria-hidden="true">|</span>
  <Button
    variant="ghost"
    size="sm"
    onClick={onLogout}
    className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-transparent px-1"
  >
    <LogOut className="w-4 h-4 mr-1" />
    Logout
  </Button>
</div>
```

Key details:
- Profile name hidden on mobile (`hidden sm:inline`), visible on tablet and up
- Pipe separator has `aria-hidden="true"` so screen readers skip it
- Logout uses the design system `Button` with `ghost` variant
- `LogOut` icon added for visual clarity
- Works for both admin and employee dashboards (same shared `Header` component)

## Summary

- 1 file changed
- No new dependencies, no database changes

