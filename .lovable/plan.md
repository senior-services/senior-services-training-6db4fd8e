

## Make Training Card Dialog Full Screen

The training card video player dialog (`VideoPlayerFullscreen` component) currently uses a standard `DialogContent` with `max-w-6xl w-[95vw]` sizing -- not a true full-screen layout. This needs to be swapped to use the existing `FullscreenDialogContent` component, consistent with how the quiz dialog was updated.

### What Changes

- The video player dialog that opens when employees click a training card will fill the viewport (with a small inset margin), matching the full-screen style already used by the quiz dialog.
- No changes to functionality, data, or layout inside the dialog -- only the outer container changes.

### Principal Engineer Review

**Top 5 Risks/Issues:**
1. None significant -- single component swap using an existing design-system primitive
2. The `onOpenAutoFocus` handler and `aria-describedby` must be preserved on the new component
3. No mobile concerns -- `FullscreenDialogContent` already handles responsive behavior
4. No accessibility impact -- same close button and focus management
5. No data or logic changes

**Top 5 Fixes/Improvements:**
1. Replace `DialogContent` import with `FullscreenDialogContent` in `VideoPlayerFullscreen.tsx`
2. Swap the component at line 445, removing `className="max-w-6xl w-[95vw]"`
3. Keep existing `onOpenAutoFocus` and `aria-describedby` props
4. Update the closing tag accordingly
5. No other changes needed

**Database Change Required:** No

**Go/No-Go Verdict:** Go -- minimal, one-line swap with no logic or data impact.

### Technical Details

**`src/components/VideoPlayerFullscreen.tsx`:**
- Line 2: Update import to include `FullscreenDialogContent` instead of (or in addition to) `DialogContent`
- Line 445: Replace `<DialogContent className="max-w-6xl w-[95vw]"` with `<FullscreenDialogContent`
- Update the corresponding closing `</DialogContent>` tag to `</FullscreenDialogContent>`
- Preserve the `onOpenAutoFocus` and `aria-describedby` props on the new component

