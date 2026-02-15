

## Add "Admin" Column to Data Export

### Overview
Add an "Admin" column immediately to the right of "Email" in the exported Excel file, showing "Yes" or "No" based on each person's `is_admin` flag.

### Changes

**`src/components/dashboard/PeopleManagement.tsx` -- `processEmployeesForExport` function**

In both export row constructions (the "no assignments" case at line 374 and the per-video case at line 418), insert an `Admin` field after `Email`:

```tsx
// Both row objects change from:
{
  Name: personName,
  Email: personEmail,
  'Training': ...,
  ...
}

// To:
{
  Name: personName,
  Email: personEmail,
  Admin: person.is_admin ? 'Yes' : 'No',
  'Training': ...,
  ...
}
```

That is the only change -- two lines added in one file.

### Files Modified
- `src/components/dashboard/PeopleManagement.tsx` (two insertions inside `processEmployeesForExport`)

### Review
1. **Top 3 Risks**: None -- additive column, no logic change.
2. **Top 3 Fixes**: (a) Admin status is already available on the `person` object via `is_admin`. (b) Column order in XLSX follows object key insertion order, so placing `Admin` after `Email` in the object literal positions it correctly.
3. **Database Change**: No.
4. **Verdict**: Go -- two lines, zero risk.

