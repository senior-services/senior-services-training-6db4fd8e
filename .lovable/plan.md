

## Add Edit Icon to People Management Table Button

### Change (1 file: `src/components/dashboard/PeopleManagement.tsx`)

**1. Add `Edit` to the lucide-react import (line 23):**
```tsx
// Before
import { UserPlus, Download, EyeOff, Eye, ChevronDown, Settings } from "lucide-react";

// After
import { UserPlus, Download, EyeOff, Eye, ChevronDown, Settings, Edit } from "lucide-react";
```

**2. Add the Edit icon inside the button (line 665):**
```tsx
// Before
>
  Edit
</Button>

// After
>
  <Edit className="w-4 h-4 mr-2" aria-hidden="true" />
  Edit
</Button>
```

This matches the exact pattern used in the Trainings table (`VideoTable.tsx` line 329).

### Review
1. **Top 3 Risks**: None -- single icon addition.
2. **Top 3 Fixes**: (a) Visual consistency with Trainings table. (b) Improved scannability for admin users.
3. **Database Change**: No.
4. **Verdict**: Go.

