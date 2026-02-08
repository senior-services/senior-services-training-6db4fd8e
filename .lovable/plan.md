

## Fix: Dialog Backgrounds in Preview Environment

### Problem
Dialogs intermittently appear with transparent backgrounds in the Lovable preview. This happens because the preview environment injects tooling elements into the DOM that compete with the dialog's `z-50` stacking context. Both the overlay and dialog content share the same z-index, allowing injected elements to render between them.

### Solution
Increase the z-index on both `DialogOverlay` and dialog content components to `z-[100]`, placing them decisively above any preview tooling. Also add `overflow-hidden` to `FullscreenDialogContent` to prevent content from rendering outside the background boundary.

### Risk Assessment

**Top 5 Risks/Issues:**
1. Other z-index-based components (tooltips, popovers, toasts) may need to stay below dialogs -- `z-[100]` is high enough to clear preview tooling but shouldn't conflict with Radix's built-in stacking
2. Multiple stacked dialogs (e.g., confirmation inside edit modal) need consistent z-index -- both `DialogContent` and `FullscreenDialogContent` get the same bump so nesting remains correct
3. Minimal change, low blast radius
4. No logic changes required
5. No impact on published site behavior (only makes preview match published)

**Top 5 Fixes/Improvements:**
1. Bump `DialogOverlay` from `z-50` to `z-[100]`
2. Bump `DialogContent` from `z-50` to `z-[100]`
3. Bump `FullscreenDialogContent` from `z-50` to `z-[100]`
4. Add `overflow-hidden` to `FullscreenDialogContent` for content clipping safety
5. Single file change, no other files affected

**Database Change Required:** No
**Go/No-Go Verdict:** Go -- CSS-only change, zero functional risk.

### Technical Detail

**File:** `src/components/ui/dialog.tsx`

Three changes:

1. **Line 22** - `DialogOverlay`: change `z-50` to `z-[100]`
2. **Line 39** - `DialogContent`: change `z-50` to `z-[100]`
3. **Line 63** - `FullscreenDialogContent`: change `z-50` to `z-[100]` and add `overflow-hidden` after `rounded-lg`

