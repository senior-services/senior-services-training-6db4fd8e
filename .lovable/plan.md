

## Fix Ghost Admin Badge -- Final Cleanup

### Overview
Remove the last redundant `employees` table update in the promotion path and streamline the self-demote callback. The real-time subscription already handles cross-admin badge sync.

### Root Cause
The promotion path (lines 93-97 in `PersonSettingsModal.tsx`) still manually updates `employees.is_admin`, but `AdminService.addAdminByEmail` already does this at line 195-199. This creates the same race condition pattern that was fixed for the demotion path.

For cross-admin visibility ("other admins see the badge disappear"), the existing real-time Supabase channel in `PeopleManagement.tsx` (line 74) already subscribes to `employees` table changes and calls `loadPeople()` automatically -- no `queryClient` is needed since this component uses direct state management, not React Query.

### Changes

**1. `PersonSettingsModal.tsx` -- Remove redundant promotion employees update**

Remove lines 93-97 (the manual `supabase.from('employees').update(...)` call). Both `addAdminByEmail` and `removeAdminRole` already handle the `employees.is_admin` column internally. This eliminates the last race condition.

The `handleToggleAdmin` function becomes purely a dispatcher to `AdminService` methods with no direct table writes.

**2. `PeopleManagement.tsx` -- Remove wasteful `loadPeople` from self-demote**

Remove `await loadPeople()` from the `onSelfDemote` callback. The user is about to be redirected and the page reloaded -- fetching data that will be immediately discarded adds latency to the redirect.

### Files Modified
- `src/components/dashboard/PersonSettingsModal.tsx` (remove lines 93-97)
- `src/components/dashboard/PeopleManagement.tsx` (remove `await loadPeople()` from `onSelfDemote`)

### Review
1. **Top 3 Risks**: (a) Relies on `addAdminByEmail` always updating `employees.is_admin` -- verified at lines 195-199 of adminService.ts. (b) Real-time subscription handles cross-admin sync -- verified at line 74 of PeopleManagement.tsx. (c) No risk to self-revocation flow since DB writes complete before redirect.
2. **Top 3 Fixes**: (a) Eliminates last redundant DB write race condition. (b) Faster self-demote redirect without unnecessary data fetch. (c) Single source of truth for `is_admin` updates (AdminService only).
3. **Database Change**: No.
4. **Verdict**: Go -- two surgical edits.
