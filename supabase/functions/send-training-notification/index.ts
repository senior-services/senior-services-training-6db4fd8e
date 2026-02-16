import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SANDBOX_EMAIL = "jeri.bowers@gmail.com";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // --- Auth: validate JWT and admin role ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } =
      await supabase.auth.getClaims(token);

    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;

    // Check admin role
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });

    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- Parse body ---
    const body = await req.json();
    const { employee_email, employee_name, app_url } = body;
    const type = body.type || "training_assignment";

    let subjectLine: string;
    let html: string;

    if (type === "admin_status_change") {
      // --- Admin status change notification ---
      const granted: boolean = body.granted;

      if (!employee_email) {
        return new Response(
          JSON.stringify({ error: "Missing required fields" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const displayName = employee_name || employee_email;
      const loginUrl = app_url ? `${app_url}/auth` : "#";
      const contentText = granted
        ? "You have been granted Administrative Privileges for the Senior Services Training Portal."
        : "Your Administrative Privileges for the Senior Services Training Portal have been removed.";
      const buttonText = granted ? "Access Admin Dashboard" : "Go to Training Portal";
      subjectLine = granted ? "Administrative Privileges Granted" : "Administrative Privileges Removed";

      html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;">
        <!-- Header -->
        <tr>
          <td style="background:#1a365d;padding:24px 32px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">Senior Services of South Sound</h1>
            <p style="margin:4px 0 0;color:#93c5fd;font-size:13px;">Access Update</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 16px;font-size:16px;color:#1a1a1a;">Hello ${displayName},</p>
            <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">
              ${contentText}
            </p>
            <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
              <tr>
                <td style="background:rgb(23,101,161);border-radius:6px;">
                  <a href="${loginUrl}" style="display:inline-block;padding:12px 32px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;">
                    ${buttonText}
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:16px 32px;background:#f9fafb;text-align:center;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">This is an automated message from Senior Services Training Portal.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    } else {
      // --- Training assignment notification (existing flow) ---
      const { training_title, training_titles, due_date } = body;
      const titles: string[] = training_titles || (training_title ? [training_title] : []);

      if (!employee_email || titles.length === 0) {
        return new Response(
          JSON.stringify({ error: "Missing required fields" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const loginUrl = app_url ? `${app_url}/auth` : "#";
      const displayName = employee_name || employee_email;
      const dueDateDisplay = due_date || "No due date set";
      subjectLine = titles.length === 1
        ? `New Training Assigned: ${titles[0]}`
        : `${titles.length} New Trainings Assigned`;

      const titlesHtml = titles.map(t =>
        `<li style="margin:0 0 6px;font-size:15px;color:#1a1a1a;font-weight:600;">${t}</li>`
      ).join("");

      const assignedLabel = titles.length === 1 ? "Assigned Training" : "Assigned Trainings";
      const introText = titles.length === 1
        ? "You have been assigned a new training. Please complete it by the due date."
        : `You have been assigned ${titles.length} new trainings. Please complete them by the due date.`;

      html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;">
        <!-- Header -->
        <tr>
          <td style="background:#1a365d;padding:24px 32px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">Senior Services of South Sound</h1>
            <p style="margin:4px 0 0;color:#93c5fd;font-size:13px;">Training Portal</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 16px;font-size:16px;color:#1a1a1a;">Hello ${displayName},</p>
            <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">
              ${introText}
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:6px;margin-bottom:24px;">
              <tr>
                <td style="padding:16px 20px;">
                  <p style="margin:0 0 8px;font-size:13px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">${assignedLabel}</p>
                  <ul style="margin:0;padding:0 0 0 18px;">${titlesHtml}</ul>
                </td>
              </tr>
              <tr>
                <td style="padding:0 20px 16px;">
                  <p style="margin:0 0 8px;font-size:13px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Due Date</p>
                  <p style="margin:0;font-size:15px;color:#1a1a1a;">${dueDateDisplay}</p>
                </td>
              </tr>
            </table>
            <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
              <tr>
                <td style="background:rgb(23,101,161);border-radius:6px;">
                  <a href="${loginUrl}" style="display:inline-block;padding:12px 32px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;">
                    Go to Training Portal
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:16px 32px;background:#f9fafb;text-align:center;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">This is an automated message from Senior Services Training Portal.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
    }

    // --- Sandbox override ---
    let finalRecipient = employee_email;
    if (employee_email !== SANDBOX_EMAIL) {
      console.log(
        `Skipping email for sandbox testing: ${employee_email}. Redirecting to ${SANDBOX_EMAIL}`
      );
      finalRecipient = SANDBOX_EMAIL;
    }

    // --- Send via Resend ---
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Senior Services Training <onboarding@resend.dev>",
        to: [finalRecipient],
        subject: subjectLine,
        html,
      }),
    });

    const resendBody = await resendRes.json();

    if (!resendRes.ok) {
      console.error("Resend API error:", JSON.stringify(resendBody));
      return new Response(
        JSON.stringify({ error: "Failed to send email", details: resendBody }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Email sent successfully:", resendBody.id);
    return new Response(JSON.stringify({ success: true, id: resendBody.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
