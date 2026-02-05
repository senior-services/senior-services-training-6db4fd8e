

# Plan: Fix "Assign to All Employees" UI Styling

## Overview

This plan addresses four styling issues in the "Add New Course" dialog's "Assign to all employees" section to match the component gallery guidelines and improve visual consistency.

---

## Changes Summary

### Issue 1: Vertical Alignment
**Problem**: The checkbox and label are misaligned because the container uses `items-start` instead of `items-center`.

**Fix**: Change the flex container from `items-start` to `items-center` so the checkbox aligns properly with the label text.

---

### Issue 2: Label Text Update
**Problem**: The label currently says "Assign to all employees" but should be more descriptive.

**Fix**: Update the label to "Assign this course to all active employees". Since this now includes the full description, the helper text below can be removed to avoid redundancy.

---

### Issue 3: Spacing Between Divider and Checkbox
**Problem**: Only 8px (`pt-2`) of spacing exists between the horizontal rule and the checkbox section.

**Fix**: Increase to 16px (`pt-4`) for better visual separation between form sections.

---

### Issue 4: Radio Button Label Font Size
**Problem**: The due date radio button labels use `text-base` (16px), which is larger than the project's typography standards for form controls.

**Fix**: Update the `DueDateSelector` component to use `text-sm` (15px) for radio button labels, matching the component gallery guidelines and the project's accessibility-focused typography standards.

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/content/AddContentModal.tsx` | Fix alignment, update label, increase spacing |
| `src/components/shared/DueDateSelector.tsx` | Change radio label font size from `text-base` to `text-sm` |

---

## Before & After

**Checkbox Section (AddContentModal.tsx)**
- `items-start` → `items-center` 
- `pt-2` → `pt-4`
- Label text updated to include "this course" and "active"
- Remove redundant helper text

**Due Date Labels (DueDateSelector.tsx)**
- `text-base` → `text-sm` on all four radio button labels

