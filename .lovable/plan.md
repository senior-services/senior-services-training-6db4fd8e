

## Automated Email Notification with Sandbox Override

### Overview

Create a `send-training-notification` Edge Function using Resend that sends email notifications when training is assigned. A temporary **sandbox override** routes all emails to `jeri.bowers@gmail.com` until domain verification is complete.

### Sandbox Override Logic

```text
Incoming request: { employee_email, employee_name, training_title, due_date, app_url }
        |
        v
Is employee_email == "jeri.bowers@gmail.com"?
   YES --> Send email to jeri.bowers@gmail.com (normal flow)
   NO  --> Log: "Skipping email for sandbox testing: [employee_email]"
           Send email to jeri.bowers@gmail.com anyway (override recipient)
```

This allows full end-to-end testing of the email template and branding in your inbox, regardless of who the training is actually assigned to.

### Step-by-Step

**Step 1 -- Store the Resend API Key**

Prompt you for the `RESEND_API_KEY` secret via the secrets tool. You will need this from your Resend dashboard at [resend.com/api-keys](https://resend.com/api-keys).

**Step 2 -- Create Edge Function**

File: `supabase/functions/send-training-notification/index.ts`

- CORS preflight handling
- JWT validation via `getClaims()` + admin role check via `has_role()` RPC
- Accepts POST body: `{ employee_email, employee_name, training_title, due_date, app_url }`
- **Sandbox override**: If `employee_email` is not `jeri.bowers@gmail.com`, log a skip message and redirect the email to `jeri.bowers@gmail.com`
- Calls Resend API (`POST https://api.resend.com/emails`) with professional HTML template
- From address: `onboarding@resend.dev` (Resend's shared sandbox sender)
- HTML email includes: branded header with Senior Services colors, training title, due date, and a CTA button linking to the app

**Step 3 -- Register in `supabase/config.toml`**

Add:
```text
[functions.send-training-notification]
verify_jwt = false
```

**Step 4 -- Add `sendNotification()` to `src/services/api.ts`**

New method on `assignmentOperations`:

```text
sendNotification({ employee_email, employee_name, training_title, due_date, app_url })
  -> supabase.functions.invoke('send-training-notification', { body })
  -> Returns ApiResult<boolean>
  -> Logs errors but never throws (fire-and-forget safe)
```

**Step 5 -- Wire into `src/components/dashboard/AssignVideosModal.tsx`**

After the successful `Promise.all(promises)` on line 384, add a fire-and-forget notification loop:

```text
for each videoId in videosToAssign:
  look up video title from local state
  call assignmentOperations.sendNotification({
    employee_email: employee.email,
    employee_name: employee.full_name,
    training_title: video title,
    due_date: formatted due date or "No due date set",
    app_url: window.location.origin
  })
```

This runs after the assignment toast -- email failures do not affect the assignment flow.

### Files

| File | Action |
|------|--------|
| `supabase/functions/send-training-notification/index.ts` | Create |
| `supabase/config.toml` | Edit -- add function entry |
| `src/services/api.ts` | Edit -- add `sendNotification()` method |
| `src/components/dashboard/AssignVideosModal.tsx` | Edit -- call notification after assign |

### Removing the Sandbox Override Later

Once your Resend domain is verified, the only change needed is in the Edge Function: remove the `SANDBOX_EMAIL` constant and the conditional redirect block. The rest of the code (from address, template, API call) stays the same.

### Review

1. **Top 3 Risks:** (a) Resend free tier caps at 100 emails/day -- sufficient for testing. (b) `onboarding@resend.dev` sender may land in spam -- expected until domain verified. (c) Sandbox override must be removed before production use.
2. **Top 3 Fixes:** (a) Sandbox override enables immediate testing without domain verification. (b) Fire-and-forget pattern keeps assignment flow fast. (c) JWT + admin role gate prevents unauthorized sends.
3. **Database Change:** No.
4. **Verdict:** Go -- pending Resend API key entry.

