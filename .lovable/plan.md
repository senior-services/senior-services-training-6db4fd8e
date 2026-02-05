

# Plan: Keep Add Course Dialog Open When Confirmation is Cancelled

## The Problem

When you fill out the "Add Course" form, check "Assign to all employees", and click "Add Course", the form dialog immediately closes and clears all your data. If you then cancel the confirmation dialog, you've lost everything you typed and have to start over.

## The Solution

Remove the automatic close behavior from the Add Course dialog's save action. Instead, let the parent component decide when to close based on whether the user confirms or cancels.

---

## What Changes

**File: `src/components/content/AddContentModal.tsx`**

Remove line 176 (`handleClose();`) from the `handleSave` function. This one-line change keeps the dialog open and preserves form data until the parent explicitly closes it.

**Before:**
```
onSave(formData);
handleClose();  ← Remove this line
```

**After:**
```
onSave(formData);
// Parent controls when to close the modal
```

---

## How It Works After the Fix

| Action | Result |
|--------|--------|
| Fill form, check "Assign to all", click Add | Confirmation dialog appears, form stays behind it |
| Cancel confirmation | Back to form with all data intact |
| Confirm assignment | Course created, both dialogs close |
| Add course without assignment | Course created, dialog closes |

---

## Files Modified

| File | Change |
|------|--------|
| `src/components/content/AddContentModal.tsx` | Remove `handleClose()` call after `onSave()` (1 line) |

No changes needed to `VideoManagement.tsx` - it already handles closing correctly on success.

