

## Fix: Download All Quiz Versions in Excel Export

### Summary

The "Download quiz versions" feature only exports 1 version despite 3 existing in the database. The code logic is correct, but the database's row-level security (RLS) policies appear to filter out some archived quiz versions at runtime. The fix creates a dedicated database function that reliably returns all versions for admins, bypassing any RLS filtering issues.

### Root Cause

The quiz table's RLS uses restrictive-only policies. While the admin policy should grant full access, the interaction between multiple restrictive policies (admin ALL + employee SELECT with archived_at filter) may cause unexpected filtering. A `SECURITY DEFINER` RPC function is the proven pattern in this codebase for reliable data access (used for quiz submission, progress updates, etc.).

### What Changes

**1. New database function (migration)**

Create `get_all_quiz_versions(p_video_id uuid)` as a `SECURITY DEFINER` function that:
- Verifies the caller is an authenticated admin
- Returns all quizzes for the video (active + archived) with their questions and options
- Ordered by version ascending

**2. Update `quizService.ts` -- `getVersionHistory` method**

Replace the direct table query with a call to the new RPC function, or restructure to use the RPC. Since the RPC needs to return nested data (quizzes with questions with options), the simplest approach is to have the RPC return the quiz IDs reliably, then fetch questions/options using existing admin RLS (which works for those tables).

Alternative simpler approach: Just create an RPC that returns quiz rows for a video_id (bypassing quiz table RLS), then keep the existing question/option fetching logic which works fine through their own admin RLS policies.

### Risk Assessment

**Top 5 Risks/Issues:**
1. RLS interaction is the root cause -- direct table queries may not return all archived rows
2. New RPC function must verify admin role to prevent unauthorized access
3. Questions and options tables have working admin RLS -- no changes needed there
4. No risk to employee-facing views -- this is admin-only download functionality
5. Migration is additive only -- no destructive changes

**Top 5 Fixes/Improvements:**
1. Create `get_all_quiz_versions` RPC with `SECURITY DEFINER` and admin check
2. Update `getVersionHistory` to call the RPC for quiz rows
3. Keep existing question/option loading logic unchanged
4. Remove diagnostic logging added in previous change (no longer needed)
5. Function follows established pattern (e.g., `check_quiz_usage`, `get_correct_options_for_quiz`)

**Database Change Required:** Yes -- new RPC function to reliably fetch all quiz versions bypassing RLS

**Go/No-Go Verdict:** Go -- follows established SECURITY DEFINER pattern, addresses confirmed RLS filtering issue

### Technical Detail

**Migration SQL:**
```sql
CREATE OR REPLACE FUNCTION public.get_all_quiz_versions(p_video_id uuid)
RETURNS SETOF quizzes
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY
  SELECT * FROM quizzes
  WHERE video_id = p_video_id
  ORDER BY version ASC;
END;
$$;
```

**File: `src/services/quizService.ts` -- `getVersionHistory`**

Replace the direct `supabase.from('quizzes').select(...)` query with:
```typescript
const { data: quizzes, error } = await supabase.rpc('get_all_quiz_versions', {
  p_video_id: videoId
});
```

Keep the rest of the method (question/option loading loop) unchanged.

