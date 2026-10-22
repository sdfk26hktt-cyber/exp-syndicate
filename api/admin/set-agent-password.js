import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { email, password, autoConfirm = true } = req.body || {};

  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Valid email is required.' });
  }

  const safeEmail = email.toLowerCase().trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(safeEmail)) {
    return res.status(400).json({ error: 'Invalid email address format.' });
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({
      error: 'Supabase Service Role Key is not configured on the server. Please add SUPABASE_SERVICE_ROLE_KEY to your environment variables in Vercel Project Settings > Environment Variables.'
    });
  }

  const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  try {
    // 1. Locate auth user by email in auth.users
    let targetUser = null;
    let page = 1;
    let hasMore = true;

    while (hasMore && !targetUser) {
      const { data: usersData, error: listErr } = await adminClient.auth.admin.listUsers({
        page,
        perPage: 100
      });

      if (listErr) {
        throw new Error(`Failed to query auth users: ${listErr.message}`);
      }

      const users = usersData?.users || [];
      targetUser = users.find(u => (u.email || '').toLowerCase().trim() === safeEmail);

      if (users.length < 100) {
        hasMore = false;
      } else {
        page++;
      }
    }

    let authResultAction = '';
    let userId = null;

    if (targetUser) {
      // User exists in auth.users: directly update password and auto-confirm email
      const updatePayload = {
        password: password
      };
      if (autoConfirm) {
        updatePayload.email_confirm = true;
      }

      const { data: updatedUserData, error: updateErr } = await adminClient.auth.admin.updateUserById(
        targetUser.id,
        updatePayload
      );

      if (updateErr) {
        throw new Error(`Failed to update password in Supabase Auth: ${updateErr.message}`);
      }

      userId = updatedUserData?.user?.id || targetUser.id;
      authResultAction = 'updated';
    } else {
      // User does not exist in auth.users yet: create user directly with password and email_confirm
      const { data: createdUserData, error: createErr } = await adminClient.auth.admin.createUser({
        email: safeEmail,
        password: password,
        email_confirm: !!autoConfirm
      });

      if (createErr) {
        throw new Error(`Failed to create user in Supabase Auth: ${createErr.message}`);
      }

      userId = createdUserData?.user?.id;
      authResultAction = 'created';
    }

    // 2. Ensure public.agents record is synchronized
    try {
      const { data: existingAgent } = await adminClient
        .from('agents')
        .select('*')
        .ilike('id', safeEmail)
        .maybeSingle();

      if (existingAgent) {
        const currentProfile = existingAgent.profile || {};
        if (!currentProfile.email || currentProfile.email.toLowerCase() !== safeEmail) {
          await adminClient
            .from('agents')
            .update({
              profile: {
                ...currentProfile,
                email: safeEmail
              }
            })
            .eq('id', existingAgent.id);
        }
      }
    } catch (agentErr) {
      console.warn('Non-critical: error verifying agents table record:', agentErr);
    }

    return res.status(200).json({
      success: true,
      action: authResultAction,
      userId,
      email: safeEmail,
      message: `Password successfully ${authResultAction === 'created' ? 'created' : 'set'} for ${safeEmail}. Account is active and confirmed.`
    });
  } catch (err) {
    console.error('Error in set-agent-password handler:', err);
    return res.status(500).json({
      error: err.message || 'An unexpected error occurred while setting the agent password.'
    });
  }
}
