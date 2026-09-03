import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const resendApiKey = process.env.RESEND_API_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { oldEmail, newEmail, requestedBy } = req.body || {};

  if (!oldEmail || !newEmail) {
    return res.status(400).json({ error: 'Both oldEmail and newEmail are required' });
  }

  const safeOldEmail = String(oldEmail).toLowerCase().trim();
  const safeNewEmail = String(newEmail).toLowerCase().trim();

  if (safeOldEmail === safeNewEmail) {
    return res.status(400).json({ error: 'New email is identical to current email' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(safeNewEmail)) {
    return res.status(400).json({ error: 'Invalid new email format' });
  }

  if (!supabaseUrl) {
    return res.status(500).json({ error: 'Supabase URL not configured in environment' });
  }

  // Use Service Role client if available for full administrative access (Auth user updates), else fallback to Anon client
  const adminClient = supabaseServiceKey 
    ? createClient(supabaseUrl, supabaseServiceKey, { auth: { autoRefreshToken: false, persistSession: false } })
    : createClient(supabaseUrl, supabaseAnonKey);

  try {
    // 1. Check if new email already exists in agents table
    const { data: existingAgent } = await adminClient
      .from('agents')
      .select('id')
      .ilike('id', safeNewEmail)
      .maybeSingle();

    if (existingAgent && existingAgent.id.toLowerCase().trim() !== safeOldEmail) {
      return res.status(409).json({ error: `An account with email "${safeNewEmail}" already exists in the system.` });
    }

    // 2. If Service Role is present, update the Supabase Auth user email
    let authUpdated = false;
    if (supabaseServiceKey && adminClient.auth?.admin) {
      try {
        const { data: usersData, error: listErr } = await adminClient.auth.admin.listUsers();
        if (!listErr && usersData?.users) {
          const targetUser = usersData.users.find(u => (u.email || '').toLowerCase().trim() === safeOldEmail);
          if (targetUser) {
            const { error: updateAuthErr } = await adminClient.auth.admin.updateUserById(targetUser.id, {
              email: safeNewEmail,
              email_confirm: true
            });
            if (updateAuthErr) {
              console.warn('Could not update Auth user email directly:', updateAuthErr);
            } else {
              authUpdated = true;
            }
          }
        }
      } catch (authErr) {
        console.warn('Auth admin list/update error:', authErr);
      }
    }

    // 3. Migrate the 'agents' table record
    const { data: oldAgentData, error: fetchErr } = await adminClient
      .from('agents')
      .select('*')
      .ilike('id', safeOldEmail)
      .maybeSingle();

    if (fetchErr) {
      console.warn('Error fetching old agent data:', fetchErr);
    }

    if (oldAgentData) {
      const newAgentRecord = {
        ...oldAgentData,
        id: safeNewEmail,
        profile: {
          ...(oldAgentData.profile || {}),
          email: safeNewEmail
        }
      };

      // Upsert new agent record
      const { error: upsertErr } = await adminClient.from('agents').upsert([newAgentRecord]);
      if (upsertErr) {
        throw new Error(`Failed to create new agent record: ${upsertErr.message}`);
      }

      // Delete old agent record
      const { error: delErr } = await adminClient.from('agents').delete().ilike('id', safeOldEmail);
      if (delErr) {
        console.warn('Could not delete old agent record:', delErr);
      }
    } else {
      // If no agent record existed under old email, create one for new email
      await adminClient.from('agents').upsert([{
        id: safeNewEmail,
        name: safeNewEmail.split('@')[0],
        status: 'onboarding',
        role: 'agent',
        profile: { email: safeNewEmail },
        created_at: new Date().toISOString()
      }]);
    }

    // 4. Migrate 'admins' table if present
    try {
      const { data: adminRecord } = await adminClient.from('admins').select('*').ilike('email', safeOldEmail).maybeSingle();
      if (adminRecord) {
        await adminClient.from('admins').upsert([{ email: safeNewEmail }]);
        await adminClient.from('admins').delete().ilike('email', safeOldEmail);
      }
    } catch (admErr) {
      console.warn('Could not migrate admins table:', admErr);
    }

    // 5. Migrate 'open_house_bookings'
    try {
      await adminClient
        .from('open_house_bookings')
        .update({ agent_email: safeNewEmail, claimed_by: safeNewEmail })
        .ilike('agent_email', safeOldEmail);
    } catch (ohErr) {
      console.warn('Could not update open_house_bookings:', ohErr);
    }

    // 6. Migrate 'posts' author_id
    try {
      await adminClient
        .from('posts')
        .update({ author_id: safeNewEmail })
        .ilike('author_id', safeOldEmail);
    } catch (postErr) {
      console.warn('Could not update posts author:', postErr);
    }

    // 7. Optional: Send courtesy notification email via Resend
    if (resendApiKey) {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${resendApiKey}`
          },
          body: JSON.stringify({
            from: 'The Syndicate Portal <support@expsyndicate.com>',
            to: [safeNewEmail],
            subject: 'Your eXp Syndicate Portal Login Email Has Been Updated',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; line-height: 1.6;">
                <h2 style="color: #00a1e0;">Login Email Updated</h2>
                <p>Hello,</p>
                <p>Your login email for The eXp Syndicate Portal has been updated from <strong>${safeOldEmail}</strong> to <strong>${safeNewEmail}</strong>.</p>
                <div style="background-color: #f8fafc; padding: 1.25rem; border-radius: 8px; margin: 1.5rem 0; border: 1px solid #e2e8f0;">
                  <p style="margin: 0;"><strong>New Login Email:</strong> <code style="font-size: 1.05em; color: #0f172a;">${safeNewEmail}</code></p>
                </div>
                <p>Please use this new email address next time you sign in to the portal.</p>
                <div style="text-align: center; margin: 2rem 0;">
                  <a href="https://agentsyndicate.com/login" style="background-color: #00a1e0; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Go to Login</a>
                </div>
                <p style="font-size: 0.85em; color: #64748b;">If you did not request or expect this change, please contact your team administrator immediately.</p>
              </div>
            `
          })
        });
      } catch (resendErr) {
        console.warn('Could not send notification email via Resend:', resendErr);
      }
    }

    return res.status(200).json({
      success: true,
      message: `Email address successfully updated from ${safeOldEmail} to ${safeNewEmail}`,
      oldEmail: safeOldEmail,
      newEmail: safeNewEmail,
      authUpdated
    });
  } catch (err) {
    console.error('Failed to update agent email:', err);
    return res.status(500).json({ error: err.message || 'Internal server error while updating email' });
  }
}
