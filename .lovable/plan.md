
## Implement Admin Self-Revocation Logout Trigger

### Overview
When an admin removes their own admin privileges via the Person Settings modal, the app should complete the database update, then redirect them to `/dashboard` (employee view) since they no longer have access to `/admin`.

### Approach
Rather than a full logout (which would force re-authentication), the cleanest approach is to navigate to `/dashboard` and force a role refresh. The existing `useUserRole` hook uses a real-time subscription that will pick up the change, causing the `/admin` route guard to deny access. However, to ensure immediate effect without race conditions, a page reload after navigation is safest.

### Changes

**1. `PersonSettingsModal.tsx` -- Accept new props and add self-revocation check**

- Add two new props: `currentUserEmail: string` and `onSelfDemote: () => void`.
- In `handleSave`, after the admin toggle API call succeeds and `stagedAdmin` is `false` while `person.is_admin` was `true`, check if `person.email` matches `currentUserEmail` (case-insensitive).
- If self-revocation detected, call `onSelfDemote()` instead of `onAdminToggled()` / `onOpenChange(false)`.

**2. `PeopleManagement.tsx` -- Pass current user email and handle self-demote**

- Accept a new prop `userEmail: string` (already available -- AdminDashboard passes it).
- Import `useNavigate` from react-router-dom.
- Pass `currentUserEmail={userEmail}` and `onSelfDemote` callback to `PersonSettingsModal`.
- The `onSelfDemote` callback navigates to `/dashboard` then triggers `window.location.reload()` to force a full state refresh (clears role cache, re-fetches role from DB).

**3. `PeopleManagement.tsx` -- Verify `userEmail` prop exists**

- Check if `userEmail` is already a prop. If not, thread it from `AdminDashboard`.

### Resulting Flow

```text
Admin clicks "Save Changes" with admin unchecked on their own record
  --> DB update completes (user_roles + employees table)
  --> Self-revocation detected (person.email === currentUserEmail)
  --> Toast: "Your admin access has been removed"
  --> Navigate to /dashboard
  --> window.location.reload() forces fresh role fetch
  --> useUserRole returns 'employee'
  --> /admin route guard redirects away
  --> Header loses purple background, admin dropdown links gone
```

### Review
1. **Top 3 Risks**: (a) Brief moment between DB write and reload where stale admin state exists -- mitigated by immediate reload. (b) If DB update fails, self-demote is never triggered (correct behavior). (c) `window.location.reload()` loses in-memory state -- acceptable since user is changing contexts.
2. **Top 3 Fixes**: (a) Self-revocation safely redirects instead of leaving admin in broken state. (b) Full reload ensures all caches (role, query client) are cleared. (c) Toast feedback before redirect informs user of what happened.
3. **Database Change**: No.
4. **Verdict**: Go -- two-file change, no new dependencies.
