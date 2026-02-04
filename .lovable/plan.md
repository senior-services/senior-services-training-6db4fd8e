

## Remove Full Name Field from Add Employee Dialog

### Summary

Remove the optional "Full Name" field from the Add New Employee dialog since it's automatically populated from the employee's Google account upon their first login.

---

### Why Remove It

- The field is already marked as optional
- The help text states: "This will be updated automatically from their Google account when they log in"
- Simplifies the form to just one required field (email)
- Reduces unnecessary data entry for admins

---

### Changes

**File:** `src/components/dashboard/AddEmployeeModal.tsx`

| Change | Details |
|--------|---------|
| Remove state | Delete `fullName` state variable (line 31) |
| Remove reset | Delete `setFullName('')` from `handleClose` (line 107) |
| Update API call | Remove `fullName.trim() || undefined` from `employeeOperations.add()` call (line 64) |
| Remove unused import | Remove `User` from lucide-react imports (line 13) |
| Remove form section | Delete lines 145-163 (the Full Name input section) |

---

### Before/After

**Before:**
- Email Address field (required)
- Full Name field (optional)

**After:**
- Email Address field (required)

---

### Files Modified

| File | Changes |
|------|---------|
| `src/components/dashboard/AddEmployeeModal.tsx` | Remove fullName state, input section, and related logic |

