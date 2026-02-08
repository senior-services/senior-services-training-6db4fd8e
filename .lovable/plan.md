

## Add Background Color to Dialog Scroll Area

### What Changes

The main content area (`DialogScrollArea`) of both standard and full-screen dialogs will get a subtle muted background (`bg-muted/50`) -- the same background used on table headers. The header and footer already have `bg-background` set explicitly, so they remain white. No other changes needed.

### Principal Engineer Review

**Top 5 Risks/Issues:**
1. Any dialog content with transparent backgrounds may now show the muted tint -- generally desirable but worth a visual check
2. Very low risk -- this is a single class addition to one shared component
3. No accessibility concern -- `bg-muted/50` is a soft neutral that maintains sufficient contrast
4. No logic or data changes
5. No impact on mobile layouts

**Top 5 Fixes/Improvements:**
1. Add `bg-muted/50` to the `DialogScrollArea` component's className
2. Verify header (`bg-background`) and footer (`bg-background`) remain unchanged -- they already do
3. No changes needed to `DialogContent` or `FullscreenDialogContent` outer wrappers
4. Single line edit in one file
5. All dialogs using this pattern benefit automatically

**Database Change Required:** No

**Go/No-Go Verdict:** Go -- one class addition, consistent with existing design tokens.

### Technical Details

**`src/components/ui/dialog.tsx` -- `DialogScrollArea` (line 102):**
- Change: `"flex-1 px-6 py-6 overflow-y-auto min-h-0"` to `"flex-1 px-6 py-6 overflow-y-auto min-h-0 bg-muted/50"`

