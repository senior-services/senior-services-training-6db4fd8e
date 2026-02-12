

## Add `text-body` to Label Component for Senior Legibility

### Problem
The `Label` component (used for radio group labels, checkbox group labels, and form field labels) has no explicit font-size class. It inherits from its parent context, which can result in labels rendering below the 16px senior minimum depending on the surrounding layout.

### Solution
Add `text-body` to the Label primitive's base class so all labels -- including radio group labels, checkbox group labels, and form field group labels -- render at 16px (1rem) with the standard 1.6 line-height.

### Changes (2 files)

**1. `src/components/ui/label.tsx`** -- Add `text-body` to the CVA base class

| Before | After |
|--------|-------|
| `"font-medium leading-none"` | `"text-body font-medium leading-none"` |

This locks every Label instance to 16px system-wide.

**2. `src/components/content/AddContentModal.tsx`** -- Remove conflicting `text-small` override (line 365)

| Before | After |
|--------|-------|
| `className="text-small font-medium cursor-pointer"` | `className="cursor-pointer"` |

The `text-small` override on this Label would fight the new base class. Removing it lets the Label inherit `text-body` from its own base. The `font-medium` is also redundant since it's already in the Label base class.

### Review
1. **Risks:** None -- `text-body` (16px) is the intended minimum for senior users. All label contexts benefit from this change.
2. **Fixes:** All radio button group labels, checkbox group labels, and form field labels now render at a guaranteed 16px.
3. **Database Change:** No.
4. **Verdict:** Go -- two small edits.

