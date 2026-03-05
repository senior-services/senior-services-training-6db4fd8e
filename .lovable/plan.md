

## Revert Banner & Add Inline Warning

### Changes — `src/components/EditVideoModal.tsx`

**1. Revert versioning banner (lines 1152–1156)** back to static `"attention"` variant with original message only:

```tsx
<Banner variant="attention" title="Versioning Notice">
  This training is already assigned. Editing the quiz will create a new version for future employees.
  Completed trainings won't be affected.
</Banner>
```

**2. Add compact inline warning banner (after line 1190, inside the Card after the title/trash row)**

When `hasAssignments && questions.length === 1`, render a compact warning banner below the "Question 1" title:

```tsx
{hasAssignments && questions.length === 1 && (
  <Banner variant="warning" size="compact">
    A minimum of one question is required for assigned trainings.
  </Banner>
)}
```

Trash icon logic remains unchanged.

### Files Changed

| File | Change |
|------|--------|
| `src/components/EditVideoModal.tsx` | Revert banner to static attention + add inline compact warning inside question card |

### Database Change
**No.**

