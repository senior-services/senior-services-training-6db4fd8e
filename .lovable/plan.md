

## Fix: Black Border on Training Card

### Problem

The inline `style={{ borderColor: 'var(--border-primary)' }}` on the TrainingCard header fails because `--border-primary` stores raw HSL values (e.g., `210 20% 77%`) without the `hsl()` wrapper. The browser treats this as invalid CSS and falls back to black.

### Change

**File: `src/components/TrainingCard.tsx`** (line 221)

Replace the inline style with the Tailwind semantic class:

```tsx
// Before
<header className="relative border-b" style={{ borderColor: 'var(--border-primary)' }}>

// After
<header className="relative border-b border-border-primary">
```

### Audit Results

A full codebase scan confirms this is the **only** instance of raw `var(--border-...)` or `var(--input)` used in inline styles. All other border usages (Header, DashboardLayout, Tabs, Dialog, EmployeeList, Sonner, Chart, ComponentsGallery) already use the correct Tailwind classes (`border-border-primary`, `border-border-secondary`).

The Tailwind config (`tailwind.config.ts`) correctly wraps all border tokens in `hsl()`, so the semantic classes work as intended.

### Review

1. **Top 3 Risks:** None -- single attribute swap, no layout impact.
2. **Top 3 Fixes:** (a) Correct color rendering. (b) Removes inline style in favor of semantic class. (c) Consistent with all other border usage in the codebase.
3. **Database Change:** No.
4. **Verdict:** Go -- single-line fix, zero risk.

