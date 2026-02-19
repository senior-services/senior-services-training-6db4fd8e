

## Fix: HTML Entity Double-Encoding -- Plain Text Standard

### Overview
Replace all `sanitizeText` (HTML-encoding) calls with a new `sanitizeInput` (trim + length-limit) function on write paths, and remove `sanitizeText` entirely from read paths. Clean existing encoded data in the database via SQL migration.

### 1. `src/utils/security.ts` -- Add `sanitizeInput`, fix `createSafeDisplayName`

Add a new function:
```typescript
export const sanitizeInput = (input: string, maxLength = 200): string => {
  if (!input || typeof input !== 'string') return '';
  return input.trim().substring(0, maxLength);
};
```

Also update `createSafeDisplayName` to use `sanitizeInput` instead of `sanitizeText` (lines 97, 106), since display names rendered in JSX are already protected by React.

### 2. `src/components/dashboard/VideoManagement.tsx` -- Write path (6 calls)

Replace `sanitizeText` with `sanitizeInput` at:
- Line 170: title on create
- Line 171: description on create (with maxLength 1000)
- Line 207: title on confirmed assignment create
- Line 208: description on confirmed assignment create (with maxLength 1000)
- Line 321: title on update
- Line 322: description on update (with maxLength 1000)

Update import: `sanitizeText` to `sanitizeInput`.

### 3. `src/components/EditVideoModal.tsx` -- Write path (10 calls)

Replace `sanitizeText` with `sanitizeInput` at:
- Lines 752, 812, 948: quiz title
- Lines 759, 832, 840, 957: question text
- Lines 769, 864, 872, 969: option text

Update import: `sanitizeText` to `sanitizeInput`.

### 4. `src/pages/EmployeeDashboard.tsx` -- Read path (2 calls)

Remove `sanitizeText` wrapper at lines 285-286:
```typescript
title: video.title || "Untitled Video",
description: video.description || "",
```

Update import to remove `sanitizeText`, keep `createSafeDisplayName` and `validateUserRole`.

### 5. `src/components/TrainingCard.tsx` -- Read path (2 calls)

Remove `sanitizeText` wrapper at lines 88-89:
```typescript
title: video.title || 'Untitled Video',
description: video.description || '',
```

Update import to remove `sanitizeText`, keep `createSafeDisplayName`.

### 6. Database Migration -- Clean existing encoded entities

```sql
-- Videos: title and description
UPDATE videos SET
  title = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(title,
    '&amp;', '&'), '&quot;', '"'), '&apos;', ''''),
    '&#39;', ''''), '&lt;', '<'), '&gt;', '>')
WHERE title LIKE '%&amp;%' OR title LIKE '%&quot;%' OR title LIKE '%&apos;%'
   OR title LIKE '%&#39;%' OR title LIKE '%&lt;%' OR title LIKE '%&gt;%';

UPDATE videos SET
  description = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(description,
    '&amp;', '&'), '&quot;', '"'), '&apos;', ''''),
    '&#39;', ''''), '&lt;', '<'), '&gt;', '>')
WHERE description LIKE '%&amp;%' OR description LIKE '%&quot;%' OR description LIKE '%&apos;%'
   OR description LIKE '%&#39;%' OR description LIKE '%&lt;%' OR description LIKE '%&gt;%';

-- Quiz questions
UPDATE quiz_questions SET
  question_text = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(question_text,
    '&amp;', '&'), '&quot;', '"'), '&apos;', ''''),
    '&#39;', ''''), '&lt;', '<'), '&gt;', '>')
WHERE question_text LIKE '%&amp;%' OR question_text LIKE '%&quot;%' OR question_text LIKE '%&apos;%'
   OR question_text LIKE '%&#39;%' OR question_text LIKE '%&lt;%' OR question_text LIKE '%&gt;%';

-- Quiz options
UPDATE quiz_question_options SET
  option_text = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(option_text,
    '&amp;', '&'), '&quot;', '"'), '&apos;', ''''),
    '&#39;', ''''), '&lt;', '<'), '&gt;', '>')
WHERE option_text LIKE '%&amp;%' OR option_text LIKE '%&quot;%' OR option_text LIKE '%&apos;%'
   OR option_text LIKE '%&#39;%' OR option_text LIKE '%&lt;%' OR option_text LIKE '%&gt;%';
```

### Files Changed

| File | Change |
|------|--------|
| `src/utils/security.ts` | Add `sanitizeInput`; update `createSafeDisplayName` |
| `src/components/dashboard/VideoManagement.tsx` | `sanitizeText` to `sanitizeInput` (write path) |
| `src/components/EditVideoModal.tsx` | `sanitizeText` to `sanitizeInput` (write path) |
| `src/pages/EmployeeDashboard.tsx` | Remove `sanitizeText` (read path) |
| `src/components/TrainingCard.tsx` | Remove `sanitizeText` (read path) |
| Database | Data cleanup migration |

### Review
1. **Top 3 Risks**: (a) Must run the SQL migration for existing data to display correctly. (b) `&#x2F;` (slash encoding) also exists in `sanitizeText` -- the migration covers the most common entities; slash encoding is unlikely in titles but won't cause visible issues. (c) None -- React handles XSS natively via JSX.
2. **Top 3 Fixes**: (a) Eliminates double-encoding on all content types. (b) Stores clean plain text going forward. (c) Cleans all existing encoded data across 3 tables.
3. **Database Change**: Yes -- data UPDATE only, no schema changes.
4. **Verdict**: Go.
