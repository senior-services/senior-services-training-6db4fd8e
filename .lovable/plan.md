

## Add Horizontal Separators Above "Hide" Sections

### Overview
Re-introduce `<Separator />` components above the "Hide Person" and "Hide Training" sections in both modals to provide visual separation between the info block and the action sections.

### Changes

**1. `src/components/dashboard/PersonSettingsModal.tsx`**
- Re-add the `Separator` import from `@/components/ui/separator`.
- Insert `<Separator />` on a new line between the person info block (line 142) and the "Hide person" section (line 144).

**2. `src/components/dashboard/TrainingSettingsModal.tsx`**
- Re-add the `Separator` import from `@/components/ui/separator`.
- Insert `<Separator />` on a new line between the training info block (line 64) and the "Hide training" section (line 66).

### Review
1. **Top 3 Risks**: None -- additive, visual-only change.
2. **Top 3 Fixes**: (a) Restores visual hierarchy between info and actions. (b) Consistent separator usage across both modals.
3. **Database Change**: No.
4. **Verdict**: Go -- two-file, two-line addition plus imports.
