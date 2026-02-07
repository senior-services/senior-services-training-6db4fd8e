

# Delete Employee Record: jbowers@southsoundseniors.org

## What this does
Removes the employee record for Jerilyn Bowers from the database so she no longer appears in the admin dashboard's employee list.

## Steps
1. Delete any **video progress** records tied to this employee (to avoid orphaned data)
2. Delete any **video assignments** tied to this employee
3. Delete the **employee record** itself

## Risk
- **Low** — The user has already been removed from Supabase Auth, so this is just cleanup
- Any training history for this employee will be permanently removed

## Technical Detail
A single SQL statement chain using the employee's email to locate and remove related records in the correct order (progress → assignments → employee) to respect foreign key relationships.

