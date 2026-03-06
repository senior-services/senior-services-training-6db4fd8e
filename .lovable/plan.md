

## Fix: Add `whitespace-nowrap` to Compact-Constrained Banner

### Change — `src/index.css`

Update `.banner-size-compact-constrained` to include `whitespace-nowrap`:

```css
.banner-size-compact-constrained {
  @apply py-2 px-3 w-fit max-w-md whitespace-nowrap;
}
```

### Files Changed

| File | Change |
|------|--------|
| `src/index.css` | Add `whitespace-nowrap` to `.banner-size-compact-constrained` |

