

## Fix: `acknowledgment_viewing_seconds` Dropped in API Service Layer

### Root Cause

The debug logs confirm `viewingSec: undefined` for all cards. The DB function correctly returns `acknowledgment_viewing_seconds`, but the API service layer in `src/services/api.ts` (lines 686-699) manually constructs the `assignment` object and **only maps specific fields** (`progress_percent`, `completed_at`, etc.). The new `acknowledgment_viewing_seconds` field is silently dropped here and never reaches the dashboard.

### Fix (1 file, 1 line)

**File: `src/services/api.ts` (~line 698)**

Add `acknowledgment_viewing_seconds` to the manually-constructed assignment object:

```typescript
// Current (line 698)
completed_at: a.completed_at || null,

// After (add new line after line 698)
completed_at: a.completed_at || null,
acknowledgment_viewing_seconds: typeof a.acknowledgment_viewing_seconds === 'number' ? a.acknowledgment_viewing_seconds : null,
```

This is a type-safe mapping that mirrors the pattern already used for `progress_percent` on line 697.

### Why the Previous Fixes Didn't Work

The `??` fix in EmployeeDashboard and the `hasStarted` logic in TrainingCard are both correct -- they just never receive the data because it's stripped out one layer deeper in the API service.

### Review

1. **Top 3 Risks**: (a) None -- additive field, existing consumers unaffected. (b) Type-safe guard prevents NaN. (c) No breaking change.
2. **Top 3 Fixes**: (a) Single line addition surfaces the data. (b) Matches existing code pattern. (c) Completes the pipeline from DB to UI.
3. **Database Change**: No.
4. **Verdict**: Go -- one line addition in the service layer.
