

## Fix: Header Disappears and Footer Breaks When Quiz Loads

### Root Cause

The `scrollIntoView({ behavior: "smooth" })` calls on lines 276, 319, and 414 are the culprit. Despite the `FullscreenDialogContent` having `overflow-hidden`, `scrollIntoView` can still programmatically scroll **all ancestor scroll containers**. This pushes the fixed header off-screen and disrupts the footer layout.

The flex structure (header/scroll-body/footer) is already correct. The issue is not CSS -- it is the scroll method.

### Fix (1 file: `src/components/VideoPlayerFullscreen.tsx`)

Replace all three `scrollIntoView` calls with scoped scrolling that only adjusts `scrollRef.current.scrollTop`.

**Change 1 -- Line 276 (attestation auto-scroll after video completion):**

```typescript
// Before
document.getElementById("attestation-section")?.scrollIntoView({ behavior: "smooth" });

// After
const el = document.getElementById("attestation-section");
if (el && scrollRef.current) {
  scrollRef.current.scrollTo({ top: el.offsetTop - scrollRef.current.offsetTop, behavior: "smooth" });
}
```

**Change 2 -- Line 319 (quiz auto-scroll after "Start Quiz" click):**

```typescript
// Before
document.getElementById("quiz-section")?.scrollIntoView({ behavior: "smooth" });

// After
const el = document.getElementById("quiz-section");
if (el && scrollRef.current) {
  scrollRef.current.scrollTo({ top: el.offsetTop - scrollRef.current.offsetTop, behavior: "smooth" });
}
```

**Change 3 -- Line 414 (quiz scroll on review mode):**

```typescript
// Before
document.getElementById("quiz-section")?.scrollIntoView({ behavior: "smooth" });

// After
const el = document.getElementById("quiz-section");
if (el && scrollRef.current) {
  scrollRef.current.scrollTo({ top: el.offsetTop - scrollRef.current.offsetTop, behavior: "smooth" });
}
```

### Why This Works

- `scrollRef.current.scrollTo()` only scrolls the inner scrollable div (the "bread" middle of the sandwich layout)
- The header and footer remain fixed because only the scroll container's `scrollTop` changes -- no ancestor containers are affected
- The `offsetTop` math ensures the target element scrolls to the top of the visible scroll area

### Review

1. **Top 3 Risks**: (a) `offsetTop` is relative to the offsetParent, which should be the scroll container -- if not, we may need `getBoundingClientRect()` instead. (b) No visual changes to footer padding or structure. (c) No logic changes.
2. **Top 3 Fixes**: (a) Scoped scrolling prevents ancestor container displacement. (b) Header stays pinned. (c) Footer height remains stable since the outer container is no longer shifted.
3. **Database Change**: No.
4. **Verdict**: Go -- 3 surgical replacements of `scrollIntoView` with scoped `scrollTo`.

