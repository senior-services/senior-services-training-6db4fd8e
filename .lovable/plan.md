

## Quiz-Only Versioning System (Revised)

### Overview

When an admin edits a quiz that employees have already completed, a new version of the quiz is created while the training stays completely untouched. The old quiz version is preserved with its historical results, and pending assignments automatically get the new quiz version. Admins access previous quiz versions via a downloadable Excel file -- not through the Edit Course dialog.

### How It Works (Non-Technical)

1. Admin opens the Edit Course dialog and clicks the Quiz tab
2. If the training has already been assigned to any employee, an attention banner appears at the top of the Quiz tab: it lets the admin know that making changes will create a new version of the quiz that future employees will receive
3. Admin edits the quiz and saves
4. The system checks if anyone has already completed the quiz
5. If yes: a confirmation dialog appears, and on confirm, a new quiz version is created (Version 2) attached to the same training
6. If nobody has taken it yet: edits happen in-place (no new version)
7. The training stays visible and unchanged in the training list -- nothing is hidden
8. Employees who already completed Version 1 keep their scores
9. Employees who haven't taken the quiz yet automatically get Version 2
10. A "Download quiz versions" link appears in the Quiz tab when multiple versions exist, generating an Excel file with all version history (questions, answers, admin metadata -- no employee data)
11. The separate "Download Data" export from the Employees tab includes a "Quiz Version" column showing which version each employee completed

### Principal Engineer Review

**Top 5 Risks/Issues:**
1. **Schema change on `quizzes` table** -- adding `version`, `version_group_id`, `archived_at`, and audit columns requires careful backfill for existing quizzes
2. **Lookup complexity** -- fetching the "current" quiz changes from a simple lookup to finding the latest non-archived version; all callers need updating
3. **Assignment check for banner** -- need to query `video_assignments` to determine if the training has been assigned, adding a data dependency to the Edit Course dialog
4. **Audit tracking** -- need `created_by` and `updated_by` columns on quizzes (currently not tracked), requiring the admin's user ID to be passed through
5. **Concurrent edit risk** -- two admins editing the same quiz simultaneously could create duplicate versions

**Top 5 Fixes/Improvements:**
1. Add `version`, `version_group_id`, `archived_at`, `created_by`, `updated_by` columns to `quizzes` table with backfill migration
2. Create a `create_quiz_version` database function that atomically copies quiz/questions/options and archives the old version
3. Update `quizService.getByVideoId` to return only the latest active (non-archived) quiz
4. Add attention banner in Quiz tab using the existing `Banner` component (`variant="attention"`) when the training has assignments
5. Add "Download quiz versions" link and include quiz version in employee "Download Data" export

**Database Change Required:** Yes -- new columns on `quizzes` table, new database function, index additions

**Go/No-Go Verdict:** Go with phased implementation.

---

### Phase 1: Database Foundation

**Migration changes to `quizzes` table:**

```text
quizzes table:
  + version             integer    NOT NULL  DEFAULT 1
  + version_group_id    uuid       NOT NULL  DEFAULT gen_random_uuid()
  + archived_at         timestamptz NULL
  + created_by          uuid       NULL      (references auth.users)
  + updated_by          uuid       NULL      (references auth.users)
  + INDEX on (version_group_id, version)
  + INDEX on (video_id, archived_at)
```

Backfill: every existing quiz gets `version = 1` and a unique `version_group_id`.

**New database function: `create_quiz_version`**

```text
Input: p_quiz_id, p_admin_user_id

Steps (single transaction):
1. Get current quiz record
2. Create new quiz row:
   - Same video_id, title, description, version_group_id
   - version = old version + 1
   - created_by = p_admin_user_id
   - archived_at = NULL
3. Set archived_at = now() on old quiz
4. Copy all quiz_questions from old to new quiz
5. Copy all quiz_question_options from old questions to new questions
6. Return new quiz_id
```

**RLS updates:**
- Employee SELECT policy on quizzes: add `archived_at IS NULL` filter so employees only see the active version
- Admin retains full access to all versions (needed for the download feature)

### Phase 2: Admin Edit Flow

**`src/services/quizService.ts` changes:**
- `getByVideoId`: filter to `archived_at IS NULL` to get the current active quiz
- Add `getVersionHistory(videoId)`: returns all quiz versions for a video with their questions, options, and admin user info
- Add `createVersion(quizId)`: calls the `create_quiz_version` RPC
- Add `hasAssignments(videoId)`: checks if any `video_assignments` exist for this training

**`src/components/EditVideoModal.tsx` changes:**

*Attention banner (new):*
- When the Quiz tab is active and the training has been assigned to at least one employee, show an attention banner at the top of the quiz content area (above the question cards)
- Uses the existing `Banner` component with `variant="attention"`
- Message: "This training has been assigned to employees. Editing the quiz will create a new version that future employees will receive. Existing completions will not be affected."
- The banner is informational only (not dismissible) -- it stays visible whenever the condition is met

*Version check on save:*
- Before saving quiz edits, check if the quiz has any attempts
- If attempts exist: show confirmation dialog ("This quiz has been completed by X employees. Saving will create Version N+1.")
- On confirm: call `create_quiz_version` RPC, then apply edits to the new quiz
- If no attempts: edit in-place as today

*Download quiz versions link:*
- Add a "Download quiz versions" link in the top-right area of the Quiz tab content, visible only when multiple versions exist
- Clicking it calls `getVersionHistory`, then generates an Excel file using `xlsx`

**Excel file: "Quiz Versions - [Training Title].xlsx"**

This file contains quiz content only -- no employee completion data.

```text
Sheet per version ("Version 1", "Version 2", etc.):
  Row 1: Version N
  Row 2: Created: [date] | Created by: [admin email]
  Row 3: Last edited: [date] | Last edited by: [admin email]
  Row 4: (blank)
  Row 5+: Question # | Question Text | Type | Option A | Option B | ... | Correct Answer(s)
```

### Phase 3: Employee Data Export

**Employee dashboard:**
- No changes needed -- `getByVideoId` returns the active quiz, so employees automatically see the correct version

**"Download Data" export from Employees tab (`src/components/dashboard/EmployeeManagement.tsx`):**
- When building the Excel export, join `quiz_attempts` with `quizzes` to get the `version` field
- Add a "Quiz Version" column showing which version each employee completed

**`get_all_employee_assignments` and `get_hidden_employee_assignments` functions:**
- Update to include quiz version info by joining through `quiz_attempts` to `quizzes`

---

### Files to Modify

| File | Change |
|------|--------|
| New migration | Add columns, backfill, create `create_quiz_version` function, update RLS |
| `src/types/quiz.ts` | Add `version`, `version_group_id`, `archived_at`, `created_by`, `updated_by` to Quiz interface |
| `src/services/quizService.ts` | Version-aware queries, `createVersion`, `getVersionHistory`, `hasAssignments` methods |
| `src/components/EditVideoModal.tsx` | Attention banner on Quiz tab when training is assigned, version check before save, confirmation dialog, "Download quiz versions" link |
| `src/components/dashboard/EmployeeManagement.tsx` | Include quiz version in employee "Download Data" Excel export |
| `src/services/adminService.ts` | Update assignment data queries to include version |

