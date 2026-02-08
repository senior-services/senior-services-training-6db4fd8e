

## Update Hide/Show Training Dialog Descriptions

### What's changing
Updating the confirmation dialog text for hiding and showing trainings to use clearer, more informative descriptions.

### Changes

**File: `src/components/dashboard/VideoManagement.tsx`**

1. **Hide Training dialog** -- Update the `AlertDialogDescription` to:
   `"{video title}" will move to the Hidden section. It will remain active for existing assignments and can be unhidden at any time.`

2. **Show Training dialog** -- Update the `AlertDialogDescription` to:
   `"{video title}" will return to the main training list and be visible to admins.`

### Review
- **Top 5 Risks**: None -- text-only changes.
- **Top 5 Fixes**: (1) Update hide description. (2) Update show description.
- **Database Change Required**: No
- **Go/No-Go**: Go

