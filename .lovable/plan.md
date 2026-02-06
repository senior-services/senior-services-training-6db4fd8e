

# Plan: Update Logout Link Styling

## Change

### File: `src/components/Header.tsx` (lines 49-56)

Update the Logout button to use the `link` variant with solid white text, underline on hover, and remove the LogOut icon.

**Before:**
```tsx
<Button
  variant="ghost"
  size="sm"
  onClick={onLogout}
  className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-transparent px-1"
>
  <LogOut className="w-4 h-4 mr-1" />
  Logout
</Button>
```

**After:**
```tsx
<Button
  variant="link"
  size="sm"
  onClick={onLogout}
  className="text-primary-foreground hover:text-primary-foreground p-0"
>
  Logout
</Button>
```

Also remove the `LogOut` icon from the lucide-react import since it's no longer used.

## Summary

- 1 file, 2 small edits (import cleanup + button update)
- Solid white text, underline on hover (built into the `link` variant), no icon

