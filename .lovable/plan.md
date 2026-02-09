

## Update Quiz Badge for Required Courses

### What's Changing
The quiz badge on required (non-completed) training cards currently shows "3 questions" -- updating it to show just the number "3" (with the chat icon). The tooltip on hover will show the full context: "Quiz: 3 questions".

### Technical Details

**File: `src/components/TrainingCard.tsx`** (lines 354-358)
- Change badge text from `{count} question{s}` to just `{count}`
- Wrap the badge in a `Tooltip` with content: "Quiz: N question(s)"

### Review
- **Top 5 Risks**: None -- cosmetic text-only change with added tooltip.
- **Top 5 Fixes**: (1) Shorten badge label to number only. (2) Add hover tooltip with full text.
- **Database Change Required**: No
- **Go/No-Go**: Go

