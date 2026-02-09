

## Remove "Social Media and Communications Policy" Training

### What This Does
Permanently deletes the training titled **"YT: Social Media and Communications Policy"** and all related data from the database. This is a one-time data operation with no code changes.

### What Gets Deleted (in order)

1. **3 quiz responses** -- individual answer records from the quiz attempt
2. **1 quiz attempt** -- the employee's quiz completion record
3. **7 quiz question options** -- answer choices for the 3 quiz questions
4. **3 quiz questions** -- the questions themselves
5. **1 quiz** -- the quiz linked to this training
6. **3 video progress records** -- employee completion/progress tracking
7. **2 video assignments** -- the training assignments to employees
8. **1 video record** -- the training itself

### What Does NOT Change
- No application code is modified
- No other trainings or employee records are affected
- The database structure (tables, functions, policies) remains unchanged

### Review
- **Top 5 Risks**: (1) This is irreversible -- all historical data for this training will be permanently lost. (2) No risk to other trainings or employees. (3) No code dependencies on this specific video ID.
- **Top 5 Fixes**: (1) Delete in correct foreign-key order to avoid constraint errors. (2) Single transaction ensures all-or-nothing cleanup.
- **Database Change Required**: Yes -- data deletion only, no schema changes.
- **Go/No-Go**: Go, pending your confirmation that you want this data permanently removed.

