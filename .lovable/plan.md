

## Add Tooltip to Disabled "Submit Quiz" Button

### What Changes
Replace the plain `Button` for "Submit Quiz" with the existing `ButtonWithTooltip` component. When disabled (questions incomplete or attestation unchecked), hovering shows: "Please answer all questions and check the attestation to submit." When enabled, no tooltip is shown.

### Change (1 file)

**File: `src/components/VideoPlayerFullscreen.tsx`**

1. **Add import** for `ButtonWithTooltip` from `@/components/ui/button-with-tooltip`

2. **Replace the Submit Quiz button** (line 617-619):

   Current:
   ```tsx
   <Button onClick={handleQuizSubmit} disabled={!allQuestionsAnswered || !quizAttestationChecked} className="shadow-md hover:shadow-lg transition-shadow">
     Submit Quiz
   </Button>
   ```

   Updated:
   ```tsx
   {(!allQuestionsAnswered || !quizAttestationChecked) ? (
     <ButtonWithTooltip
       tooltip="Please answer all questions and check the attestation to submit."
       disabled
       className="shadow-md hover:shadow-lg transition-shadow"
     >
       Submit Quiz
     </ButtonWithTooltip>
   ) : (
     <Button
       onClick={handleQuizSubmit}
       className="shadow-md hover:shadow-lg transition-shadow"
     >
       Submit Quiz
     </Button>
   )}
   ```

   This conditionally renders: a disabled button with tooltip when not ready, or an active button without tooltip when ready.

### Review
- **Top 5 Risks**: (1) None -- uses an existing, tested component (`ButtonWithTooltip`). (2) No change to submission logic. (3) No accessibility regression -- `ButtonWithTooltip` already handles keyboard focus on disabled buttons. (4) No layout shift -- same button styling. (5) No database impact.
- **Top 5 Fixes**: (1) Swap `Button` for conditional `ButtonWithTooltip`/`Button` render. (2) Add import. (3-5) N/A -- minimal change.
- **Database Change Required**: No
- **Go/No-Go**: Go
