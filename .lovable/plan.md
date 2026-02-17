

## Delete Unused EmployeeManagement.tsx and Clean Up References

### Changes

**1. Delete file:**
- `src/components/dashboard/EmployeeManagement.tsx`

**2. Edit `src/utils/componentUpdates.ts`:**
Remove `'EmployeeManagement'` from 6 arrays in the `COMPONENT_DEPENDENCIES` map:
- `button` array (line 11)
- `card` array (line 17)
- `badge` array (line 20)
- `loading-spinner` array (line 38)
- `alert-dialog` array (line 41)
- `collapsible` array (line 53)

**3. No change needed** in `PeopleManagement.tsx` -- the reference there is just a code comment ("ported from EmployeeManagement"), which serves as useful history and has no runtime impact.

### Review
1. **Top 3 Risks**: None -- file is dead code with zero imports.
2. **Top 3 Fixes**: (a) Removes ~300+ lines of dead code. (b) Cleans up dependency tracker. (c) No runtime impact.
3. **Database Change**: No.
4. **Verdict**: Go -- safe deletion of unused file and string references.

