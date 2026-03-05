

## Change Login Page Background to Red

The login page (`src/pages/Auth.tsx`, line 111) uses the `.bg-gradient-hero` class, defined in `src/index.css` line 428-429 as a blue gradient.

### Change

**`src/index.css` (line 429)** -- Update the gradient to a red palette:

```css
.bg-gradient-hero {
  background: linear-gradient(135deg, hsl(0, 75%, 36%), hsl(0, 52%, 50%));
}
```

This changes the background from blue to red while preserving the gradient structure. Note this class is also used on the Landing page -- both pages will be affected.

**Alternative**: If you want only the Auth page to be red (keeping Landing blue), we'd add a new class like `.bg-gradient-auth` and apply it only on the Auth page.

