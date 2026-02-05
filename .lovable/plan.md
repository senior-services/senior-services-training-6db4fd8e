

## Add New Background Tokens to Components Gallery

### Summary

Update the Color Palette section in the Components Gallery to display the newly added background tokens and reflect the rename from `--background` to `--background-main`.

---

### Changes Required

**File:** `src/pages/ComponentsGallery.tsx`

#### Update UI Colors Section (Lines 347-373)

Replace the current "Background" entry and add the new tokens:

| Token | Class | Description |
|-------|-------|-------------|
| --background-main | `bg-background-main` | Main page background (renamed from --background) |
| --background-header | `bg-background-header` | Deep navy for headers |
| --background-primary | `bg-background-primary` | Deep blue (matches primary) |
| --background-muted | `bg-background-muted` | Light blue tint |
| --card | `bg-card` | Card background (existing) |
| --muted | `bg-muted` | Muted background (existing) |

---

### Updated UI Colors Section

```jsx
{/* UI Colors */}
<div className="space-y-3">
  <h4 className="text-sm font-bold uppercase text-secondary">UI Colors</h4>
  <div className="space-y-2">
    <div className="flex items-center gap-3">
      <div className="w-12 h-12 rounded-lg bg-background-main border border-border-primary shadow-md"></div>
      <div>
        <div className="text-sm font-medium">Background Main</div>
        <div className="text-xs text-muted-foreground">--background-main</div>
      </div>
    </div>
    <div className="flex items-center gap-3">
      <div className="w-12 h-12 rounded-lg bg-background-header border border-border-primary shadow-md"></div>
      <div>
        <div className="text-sm font-medium">Background Header</div>
        <div className="text-xs text-muted-foreground">--background-header</div>
      </div>
    </div>
    <div className="flex items-center gap-3">
      <div className="w-12 h-12 rounded-lg bg-background-primary border border-border-primary shadow-md"></div>
      <div>
        <div className="text-sm font-medium">Background Primary</div>
        <div className="text-xs text-muted-foreground">--background-primary</div>
      </div>
    </div>
    <div className="flex items-center gap-3">
      <div className="w-12 h-12 rounded-lg bg-background-muted border border-border-primary shadow-md"></div>
      <div>
        <div className="text-sm font-medium">Background Muted</div>
        <div className="text-xs text-muted-foreground">--background-muted</div>
      </div>
    </div>
    {/* Existing Card and Muted entries remain */}
  </div>
</div>
```

---

### Files Modified

| File | Change |
|------|--------|
| `src/pages/ComponentsGallery.tsx` | Update UI Colors section to include all 4 new background tokens |

---

### Visual Result

The UI Colors section will display 6 background-related swatches:
1. **Background Main** - White (light) / Dark navy (dark)
2. **Background Header** - Deep navy rgb(29, 69, 100)
3. **Background Primary** - Deep blue rgb(23, 101, 161)
4. **Background Muted** - Light blue tint rgb(218, 233, 245)
5. **Card** - Card surface color
6. **Muted** - Muted surface color

