
## Remove Content Type Section from Add New Course Dialog

### What's changing
Removing the manual "Content Type" radio selector that appears when the URL type cannot be auto-detected (lines 286-314). The auto-detection logic will remain, but users will no longer be prompted to manually choose between Video and Presentation.

### Changes

**File: `src/components/content/AddContentModal.tsx`**

1. **Remove the manual content type selector UI** (lines 286-314) -- the entire `{showManualSelector && !urlError && (...)}` block with the RadioGroup.

2. **Remove the auto-detected success message** (lines 277-281) -- the "Auto-detected: Video/Presentation" text, since content type is no longer surfaced to the user.

3. **Clean up unused imports** -- Remove `RadioGroup` and `RadioGroupItem` imports (line 14) since they are no longer used.

4. **Remove `showManualSelector` state** (line 43) and all references to `setShowManualSelector` throughout the file (lines 59, 69, 80, 86, 94, 97, 184, 203, 259, 277).

### Review

- **Top 5 Risks**: (1) Content type will always default to "video" if auto-detection fails -- acceptable if that is the desired behavior. (2) No other risks -- UI-only change.
- **Top 5 Fixes**: (1) Remove the manual selector block. (2) Remove unused state/imports. (3) Simplify URL status display.
- **Database Change Required**: No
- **Go/No-Go**: Go
