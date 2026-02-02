

## Add Muted Background at 50% Opacity to Main Container

### Overview
Add a semi-transparent muted background color to the `<main>` container in the AdminDashboard, excluding the header.

---

### Change Required

**File: `src/pages/AdminDashboard.tsx`**  
**Line 41**

**Current:**
```tsx
<main className="container mx-auto px-4 pb-8">
```

**Updated:**
```tsx
<main className="container mx-auto px-4 pb-8 bg-muted/50">
```

---

### Result
The main content area (below the header) will have a muted background color at 50% opacity, creating a subtle visual distinction from the header and page background.

