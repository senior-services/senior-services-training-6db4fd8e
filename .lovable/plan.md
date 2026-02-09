

## Add Compact Inline Banner Variant to Style Guide

### What This Does
Creates a simplified, more compact way to use the existing Banner component -- without a title, with reduced padding -- for inline contextual messages. No new component is needed; we add a `compact` size prop to the existing Banner and document the pattern in the style guide.

### Changes

**File 1: `src/components/ui/banner.tsx`**
- Add a `size` variant to `bannerVariants` with two options:
  - `default` -- current padding (`p-4`)
  - `compact` -- reduced padding (`py-2 px-3`), smaller icon (`h-4 w-4`), no shadow, no hover shadow
- Update the icon size to respond to the `size` prop (compact uses `h-4 w-4` instead of `h-5 w-5`)
- Add `size` to the `BannerProps` interface

**File 2: `STYLEGUIDE.md`**
- After the existing "Other Banner Types" examples, add a new section: **Inline Banners (Compact)**
- Document the pattern: use `size="compact"` with `description` only (no `title`)
- Show examples for each variant:

```tsx
// Compact inline info
<Banner variant="info" size="compact" description="This field is optional." />

// Compact inline warning
<Banner variant="warning" size="compact" description="Changes will take effect immediately." />

// Compact inline success
<Banner variant="success" size="compact" description="All answers saved." />

// Compact inline error
<Banner variant="error" size="compact" description="Please fix the errors above." />

// Compact with dismiss
<Banner 
  variant="attention" 
  size="compact" 
  description="Review pending items before submitting." 
  dismissible 
  onDismiss={() => handleDismiss()} 
/>
```

- Add guideline: "Use inline banners for brief, contextual messages within forms or sections. Use full banners for page-level alerts."

### Review
- **Top 5 Risks**: (1) Must ensure compact size doesn't break existing Banner usages (default size remains unchanged). (2) Icon sizing needs to scale with compact mode. (3) No logic changes. (4) No database changes. (5) No accessibility impact -- role="alert" is preserved.
- **Top 5 Fixes**: (1) Add `size` variant to CVA config. (2) Adjust icon class based on size. (3) Remove shadow in compact mode. (4) Document inline pattern in STYLEGUIDE.md. (5) Add usage guideline for when to use compact vs full.
- **Database Change Required**: No
- **Go/No-Go**: Go
