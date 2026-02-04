

## Standardize Form Field Labels - Revised Plan

### Summary

Standardize all form field labels across training, employee, and admin dialogs:
- **Required fields**: Plain label text (no asterisk)
- **Optional fields**: Label with `(optional)` in italics to the right

---

### 5 Fixes to Implement

| # | Fix | File | Details |
|---|-----|------|---------|
| 1 | Remove asterisk from Email Address | `AddEmployeeModal.tsx` | Line 124: Change `Email Address *` → `Email Address` |
| 2 | Add styled optional indicator to Description | `AddContentModal.tsx` | Line 213: Add italic `(optional)` span |
| 3 | Add styled optional indicator to Description | `EditVideoModal.tsx` | Line 864: Add italic `(optional)` span |
| 4 | Restyle existing optional indicator | `EditVideoModal.tsx` | Line 883: Convert `Description (Optional)` to styled span format |
| 5 | Restyle existing optional indicator | `CreateQuizModal.tsx` | Line 230: Convert `Description (Optional)` to styled span format |

---

### Consistent Styling Pattern

All optional field labels will use this format:

```tsx
<Label htmlFor="field-id">
  Field Name <span className="font-normal italic text-muted-foreground">(optional)</span>
</Label>
```

**Why these styles:**
- `font-normal` — prevents optional text from inheriting bold weight from label
- `italic` — makes it visually distinct as secondary information
- `text-muted-foreground` — lighter color to de-emphasize

---

### Detailed Changes

**1. AddEmployeeModal.tsx (Line 123-125)**
```tsx
// Before
<Label htmlFor="email">
  Email Address *
</Label>

// After
<Label htmlFor="email">
  Email Address
</Label>
```

**2. AddContentModal.tsx (Line 213)**
```tsx
// Before
<Label htmlFor="description">Description</Label>

// After
<Label htmlFor="description">Description <span className="font-normal italic text-muted-foreground">(optional)</span></Label>
```

**3. EditVideoModal.tsx - Details Tab (Line 864)**
```tsx
// Before
<Label htmlFor="edit-description">Description</Label>

// After
<Label htmlFor="edit-description">Description <span className="font-normal italic text-muted-foreground">(optional)</span></Label>
```

**4. EditVideoModal.tsx - Quiz Tab (Line 883)**
```tsx
// Before
<Label htmlFor="quiz-description">Description (Optional)</Label>

// After
<Label htmlFor="quiz-description">Description <span className="font-normal italic text-muted-foreground">(optional)</span></Label>
```

**5. CreateQuizModal.tsx (Line 230)**
```tsx
// Before
<Label htmlFor="description">Description (Optional)</Label>

// After
<Label htmlFor="description">Description <span className="font-normal italic text-muted-foreground">(optional)</span></Label>
```

---

### Files Modified

| File | Changes |
|------|---------|
| `src/components/dashboard/AddEmployeeModal.tsx` | Remove `*` from Email Address label |
| `src/components/content/AddContentModal.tsx` | Add styled `(optional)` to Description |
| `src/components/EditVideoModal.tsx` | Update 2 Description labels with styled `(optional)` |
| `src/components/quiz/CreateQuizModal.tsx` | Update Description label with styled `(optional)` |

---

### Verification Confirmed

- AdminManagement.tsx: Email Address label already has no asterisk (correct)
- All dialogs checked for Label patterns - no other changes needed

