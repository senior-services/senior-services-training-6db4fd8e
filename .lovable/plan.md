

## Update Tooltip Text for Submit Quiz and Add Tooltip to Disabled Attestation Checkbox

### What Changes

Two small text/tooltip updates in the quiz training dialog:

1. **Submit Quiz button tooltip** -- Change from "Please answer all questions and check the attestation to submit." to "Complete the questions above and the final confirmation to submit."

2. **Attestation checkbox tooltip** -- When the checkbox is disabled (questions not yet completed), wrap it in a tooltip that says "Complete the questions above to enable this checkbox." When enabled, no tooltip is needed.

### Changes (1 file)

**File: `src/components/VideoPlayerFullscreen.tsx`**

#### 1. Update Submit Quiz tooltip text (line 626)

Change:
```tsx
tooltip="Please answer all questions and check the attestation to submit."
```
To:
```tsx
tooltip="Complete the questions above and the final confirmation to submit."
```

#### 2. Add tooltip to disabled attestation checkbox (lines 577-592)

Wrap the checkbox + label in a `Tooltip` when disabled. Import `Tooltip`, `TooltipContent`, `TooltipTrigger` (already imported in the file). When `!allQuestionsAnswered`, wrap the attestation content in tooltip components showing "Complete the questions above to enable this checkbox." When enabled, render without tooltip.

```tsx
{!allQuestionsAnswered ? (
  <Tooltip delayDuration={300}>
    <TooltipTrigger asChild>
      <div className="flex items-start gap-2">
        <Checkbox ... disabled />
        <Label ... className="text-muted-foreground cursor-not-allowed">
          I certify that I have read and understood this content.
        </Label>
      </div>
    </TooltipTrigger>
    <TooltipContent>
      <p>Complete the questions above to enable this checkbox.</p>
    </TooltipContent>
  </Tooltip>
) : (
  <div className="flex items-start gap-2">
    <Checkbox ... />
    <Label ...>
      I certify that I have read and understood this content.
    </Label>
  </div>
)}
```

### Review
- **Top 5 Risks**: (1) None -- text-only and tooltip additions, no logic change. (2) Tooltip imports already present in file. (3) No accessibility regression -- tooltips are keyboard-accessible via the wrapping element. (4) No layout shift. (5) No database impact.
- **Top 5 Fixes**: (1) Update tooltip string on Submit Quiz button. (2) Add conditional Tooltip wrapper on attestation checkbox. (3-5) N/A.
- **Database Change Required**: No
- **Go/No-Go**: Go
