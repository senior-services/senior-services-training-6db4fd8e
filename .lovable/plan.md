

## Revised: Training Type Segmented Control

Two updates to the previously approved plan:

### Change 1 -- Default to "Video"

The toggle will default to **Video** (not unselected). This means:
- `contentType` stays as `ContentType` (no widening to `""`)
- No extra validation needed for "must select a type"
- Reset logic keeps defaulting to `"video"` (matches current behavior)

### Change 2 -- Helper text for Minimum Viewing Time

The helper text below the "Minimum Viewing Time" input will read:

> Minimum 60 seconds required. Necessary for compliance to ensure review, as progress cannot be tracked for PPSX files.

Styled with `className="form-helper-text"`, placed between the label and the input.

### File Changes

**1. `src/utils/videoUtils.ts`** -- Add `.ppsx` detection

Before the `return null` at the end of `detectContentTypeFromUrl`, add a check: if the URL path (lowercased) ends in `.ppsx`, return `'presentation'`.

**2. `src/components/content/AddContentModal.tsx`**

- Add imports: `ToggleGroup`, `ToggleGroupItem` from `@/components/ui/toggle-group`
- Add state: `minViewingTime` (number, default `60`)
- Keep `contentType` default as `"video"` (no change from current)
- After the URL field block (line ~301), insert:
  - **Training Type** label + `ToggleGroup` with `variant="pill"`, two items: Video / Presentation
  - Conditionally (when `contentType === "presentation"`): **Minimum Viewing Time** label, helper text (`form-helper-text`), and number input (min 60, default 60)
- Auto-detection in `handleUrlChange` unchanged (already sets contentType on match)
- `handleSave`: add `duration_seconds: contentType === 'presentation' ? minViewingTime : undefined` to formData
- `ContentFormData` interface: add `duration_seconds?: number`
- Reset: `minViewingTime` resets to `60` in both `useEffect` and `handleClose`

### Everything else stays the same

No changes to existing fields, validation logic, commented-out assign-to-all section, or CSS definitions.

### Review

- **Top 3 Risks:** (1) `duration_seconds` needs the parent handler to persist it -- if ignored, it silently drops. (2) Minimal visual risk since ToggleGroup pill variant is proven. (3) None structural.
- **Top 3 Fixes:** (1) Clear visual indicator of training mode. (2) URL auto-detection reduces admin effort. (3) Helper text explains the compliance rationale for the timer.
- **Database Change:** No
- **Verdict:** Go

