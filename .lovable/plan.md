

## Admin Status Change Email Notification

### Overview

Extend the `send-training-notification` Edge Function with a new `admin_status_change` type, add a corresponding API method, and trigger the notification from `PersonSettingsModal` when admin privileges are granted or revoked.

### 1. Edge Function (`supabase/functions/send-training-notification/index.ts`)

- Parse an optional `type` field from the request body (default: `"training_assignment"`)
- When `type === "admin_status_change"`, parse a `granted` boolean field
- Skip training-specific validation (titles, due date) for this type
- Build a separate HTML template:
  - Header: "Senior Services of South Sound" / sub-header: "Access Update"
  - Body (granted): "You have been granted Administrative Privileges for the Senior Services Training Portal."
  - Body (revoked): "Your Administrative Privileges for the Senior Services Training Portal have been removed."
  - Button text: granted = "Access Admin Dashboard", revoked = "Go to Training Portal"
  - Button color: `rgb(23,101,161)` (--primary brand color)
  - Button link: `${app_url}/auth` (same as training notification)
  - Subject: "Administrative Privileges Granted" or "Administrative Privileges Removed"
- Sandbox override remains active
- Existing training_assignment flow is untouched (backward compatible)

### 2. API Service (`src/services/api.ts`)

Add a new method `sendAdminStatusNotification` to `assignmentOperations`:

```typescript
async sendAdminStatusNotification(params: {
  employee_email: string;
  employee_name: string;
  granted: boolean;
  app_url: string;
}): Promise<ApiResult<boolean>>
```

This invokes `send-training-notification` with `{ type: "admin_status_change", ...params }`.

### 3. PersonSettingsModal (`src/components/dashboard/PersonSettingsModal.tsx`)

In `handleSave`, after the successful `handleToggleAdmin` call (line 110), fire-and-forget the notification:

```typescript
import { assignmentOperations } from '@/services/api';

// After successful admin toggle
assignmentOperations.sendAdminStatusNotification({
  employee_email: person.email,
  employee_name: person.full_name || person.email,
  granted: stagedAdmin,
  app_url: window.location.origin,
}).catch(() => {}); // fire-and-forget
```

Self-demotion is already blocked by `isSelf` disabling the checkbox (line 184).

### Files

| File | Action |
|------|--------|
| `supabase/functions/send-training-notification/index.ts` | Edit -- add `admin_status_change` branch with dynamic button text |
| `src/services/api.ts` | Edit -- add `sendAdminStatusNotification` method |
| `src/components/dashboard/PersonSettingsModal.tsx` | Edit -- trigger notification after admin toggle |

### Review

1. **Top 3 Risks:** (a) Existing training flow must not break -- mitigated by defaulting `type` to `"training_assignment"`. (b) Self-demotion -- already blocked by `isSelf` guard. (c) Notification failure must not block save -- fire-and-forget pattern.
2. **Top 3 Fixes:** (a) Users get immediate email confirmation of privilege changes. (b) Dynamic button text ("Access Admin Dashboard" vs "Go to Training Portal") provides clear next action. (c) Single Edge Function handles both types, reducing maintenance.
3. **Database Change:** No.
4. **Verdict:** Go.
