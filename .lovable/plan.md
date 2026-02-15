

## Diagnose and Fix Ghost Admin Badge -- Error Visibility and Diagnostics

### Overview
Three surgical edits to surface silent DB failures, confirm subscription health, and isolate whether the ghost badge is a backend or frontend issue.

### Changes

**1. `src/services/adminService.ts` (lines 322-330) -- Throw on failure instead of logging**

Replace the current log-only pattern with a thrown error so the modal's `handleSave` catch block surfaces a red toast to the user.

```typescript
if (targetEmail) {
  const { error: empError } = await supabase
    .from('employees')
    .update({ is_admin: false } as any)
    .eq('email', targetEmail);
  console.log(`[AdminService] removeAdminRole employees update for ${targetEmail}:`, empError ? 'FAILED' : 'SUCCESS');
  if (empError) throw new Error('Failed to update employee admin status: ' + empError.message);
} else {
  console.warn(`[AdminService] removeAdminRole: No email found for user ${userId}, employees.is_admin NOT updated`);
  throw new Error('No email found for user, cannot update admin status');
}
```

This ensures that if RLS blocks the write, the UI shows a destructive toast instead of silently closing the modal.

**2. `src/components/dashboard/PeopleManagement.tsx` (line 93, inside `loadPeople`) -- Add Jane diagnostic log**

After `const data = await employeeOperations.getAll();`, add:

```typescript
console.log('[PeopleManagement] Jane data from DB:', data.data?.find(p => p.email === 'jane.doe@southsoundseniors.org'));
```

This proves whether the ghost badge is a backend data issue (DB still has `is_admin: true`) or a frontend rendering bug.

**3. `src/components/dashboard/PeopleManagement.tsx` (line 72) -- No changes needed**

The subscription already uses `schema: 'public'`, `event: '*'`, and `table: 'employees'` at line 74. The channel name `'people-management'` is fine -- the `'public:employees'` naming convention is cosmetic only; the filter params are what matter. No change required here.

### Files Modified
- `src/services/adminService.ts` (throw on empError + throw when no email found)
- `src/components/dashboard/PeopleManagement.tsx` (add Jane diagnostic log in loadPeople)

### Review
1. **Top 3 Risks**: (a) Throwing on failure could surface previously hidden RLS errors -- this is desired behavior. (b) The Jane-specific log is diagnostic only, should be removed after debugging. (c) No subscription change needed; current config is already correct.
2. **Top 3 Fixes**: (a) Silent failures become visible error toasts. (b) Diagnostic log isolates backend vs. frontend root cause. (c) Both `else` branches (no email found) now also throw, preventing silent no-ops.
3. **Database Change**: No.
4. **Verdict**: Go -- two files, three lines added.

