

## Change Email Max Width in Employees Tab

### Overview
Update the max width of the email text in the Name column from 200px to 400px.

---

### Change Required

**File: `src/components/dashboard/EmployeeManagement.tsx`**  
**Line 436**

**Current:**
```tsx
<span 
  className="text-xs text-muted-foreground font-normal truncate max-w-[200px]" 
  title={employee.email}
>
```

**Updated:**
```tsx
<span 
  className="text-xs text-muted-foreground font-normal truncate max-w-[400px]" 
  title={employee.email}
>
```

---

### Result
The email address will now display up to 400px wide before truncating with an ellipsis, allowing more of the email to be visible.

