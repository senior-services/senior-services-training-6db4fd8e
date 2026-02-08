

## Show Quiz Version Badge in Trainings Tab

### Summary

When a quiz has been versioned (more than one version exists), display a small "v{n}" badge next to the checkmark in the Quiz column, where {n} is the current (latest active) version number. Uses the `soft-tertiary` badge variant per the design system.

### What Changes

**1. Quiz data loading (`VideoTable.tsx`, lines 58-83)**

Replace the `Set<string>` (boolean presence) with a `Map<string, { hasQuiz: boolean; version: number; versionCount: number }>` so we know both presence and version info.

**2. New quiz service method (`quizService.ts`)**

Add a `getQuizVersionInfo(videoId)` method that queries the quizzes table grouped by `version_group_id` to return the active quiz's version number and total version count for that video. This avoids N+1 queries by fetching all needed data in one call per video (same pattern as existing `hasQuiz`).

**3. Quiz column rendering (`VideoTable.tsx`, lines 252-259)**

After the checkmark SVG, conditionally render a `Badge variant="soft-tertiary"` showing "v{version}" when `versionCount > 1`.

### Visual Result

- Quiz with 1 version: checkmark only (no change)
- Quiz with 2+ versions: checkmark followed by a small gray "v2" badge

### Risk Assessment

**Top 5 Risks/Issues:**
1. Additional query per video -- same pattern as existing `hasQuiz`, minimal overhead
2. Badge must not shift table layout -- inline-flex keeps it compact
3. Version number should reflect the active (non-archived) quiz, not total count
4. No risk to employee-facing views -- change is admin VideoTable only
5. Badge text must stay concise ("v2", not "Version 2")

**Top 5 Fixes/Improvements:**
1. Add `getQuizVersionInfo` to quizService returning version number and count
2. Update VideoTable state from `Set` to `Map` with version metadata
3. Render `Badge variant="soft-tertiary"` with "v{n}" next to checkmark
4. Accessible: badge includes aria context for screen readers
5. Follows existing design system -- soft-tertiary matches the component gallery

**Database Change Required:** No

**Go/No-Go Verdict:** Go -- small UI addition using existing data and design patterns.

### Technical Detail

**File 1: `src/services/quizService.ts`**

Add method:
```typescript
async getQuizVersionInfo(videoId: string): Promise<{ hasQuiz: boolean; version: number; versionCount: number }> {
  // Query all quizzes for this video (active + archived) to get total count
  // Then get the active quiz's version number
}
```

**File 2: `src/components/dashboard/VideoTable.tsx`**

- Change state: `useState<Map<string, { version: number; versionCount: number }>>(new Map())`
- Update useEffect to call `getQuizVersionInfo` instead of `hasQuiz`
- Update Quiz column cell (lines 252-259):

```tsx
<TableCell className="text-center py-2">
  {quizInfo.has(video.id) && (
    <div className="flex items-center justify-center gap-1">
      <svg ...>checkmark</svg>
      {quizInfo.get(video.id)!.versionCount > 1 && (
        <Badge variant="soft-tertiary">
          v{quizInfo.get(video.id)!.version}
        </Badge>
      )}
    </div>
  )}
</TableCell>
```
