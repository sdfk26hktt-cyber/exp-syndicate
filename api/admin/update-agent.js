import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

const MASTER_ADMINS = ['brian@brianburds.com', 'brenda@brianburds.com'];

async function verifyAdminCaller(client, requestedBy) {
  const email = String(requestedBy || '').toLowerCase().trim();
  if (!email) return false;
  if (MASTER_ADMINS.includes(email)) return true;

  try {
    const { data: adminRow } = await client
      .from('admins')
      .select('email')
      .ilike('email', email)
      .maybeSingle();
    if (adminRow) return true;
  } catch (_err) {
    // ignore if admins table unavailable
  }

  try {
    const { data: agentRow } = await client
      .from('agents')
      .select('id, status, profile')
      .ilike('id', email)
      .maybeSingle();
    if (agentRow && (agentRow.status === 'admin' || agentRow.profile?.role === 'Administrator')) {
      return true;
    }
  } catch (_err) {
    // ignore
  }

  return false;
}

export default async function handler(req, res) {
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

  const { agentId, name, status, profile, phases, requestedBy } = req.body || {};

  if (!agentId || typeof agentId !== 'string' || !agentId.trim()) {
    return res.status(400).json({ error: 'agentId is required.' });
  }

  if (!supabaseUrl || (!supabaseServiceKey && !supabaseAnonKey)) {
    return res.status(500).json({ error: 'Supabase credentials are not configured on the server.' });
  }

  const adminClient = createClient(
    supabaseUrl,
    supabaseServiceKey || supabaseAnonKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  try {
    const isAuthorized = await verifyAdminCaller(adminClient, requestedBy);
    if (!isAuthorized) {
      return res.status(403).json({ error: 'Unauthorized: Administrator privileges required.' });
    }

    const cleanId = agentId.trim();

    // 1. Locate existing agent row (exact match -> ilike -> trimmed scan for legacy imported IDs)
    let existingAgent = null;
    const { data: exactMatch } = await adminClient
      .from('agents')
      .select('*')
      .eq('id', cleanId)
      .maybeSingle();

    if (exactMatch) {
      existingAgent = exactMatch;
    } else {
      const { data: ilikeMatch } = await adminClient
        .from('agents')
        .select('*')
        .ilike('id', cleanId)
        .maybeSingle();

      if (ilikeMatch) {
        existingAgent = ilikeMatch;
      } else {
        const { data: allRows } = await adminClient.from('agents').select('*');
        if (Array.isArray(allRows)) {
          const lowerClean = cleanId.toLowerCase();
          existingAgent = allRows.find(
            r =>
              (r.id || '').toLowerCase().trim() === lowerClean ||
              (r.profile?.email || '').toLowerCase().trim() === lowerClean
          ) || null;
        }
      }
    }

    const actualId = existingAgent?.id || cleanId.toLowerCase();
    const effectiveStatus = status || existingAgent?.status || 'onboarding';
    const friendlyRole = effectiveStatus === 'guest' ? 'Guest'
      : effectiveStatus === 'admin' ? 'Administrator'
      : effectiveStatus === 'flex_agent' ? 'Flex Agent'
      : effectiveStatus === 'team_agent' ? 'Team Agent'
      : effectiveStatus === 'onboarding' ? 'Onboarding Agent'
      : (profile?.role || existingAgent?.profile?.role || 'Agent');

    const mergedProfile = {
      ...(existingAgent?.profile || {}),
      ...(profile || {}),
      ...(status ? { role: friendlyRole } : {})
    };

    const updatedName = (typeof name === 'string' && name.trim())
      ? name.trim()
      : (existingAgent?.name || actualId.split('@')[0]);

    const updatePayload = {
      name: updatedName,
      profile: mergedProfile,
      ...(status ? { status } : {}),
      ...(phases !== undefined ? { phases } : {})
    };

    let savedAgent = null;

    if (existingAgent?.id) {
      const { data, error } = await adminClient
        .from('agents')
        .update(updatePayload)
        .eq('id', actualId)
        .select()
        .maybeSingle();

      if (error) {
        throw new Error(`Database update failed: ${error.message}`);
      }
      if (!data) {
        throw new Error(`Update matched 0 rows for agent "${actualId}" (check database RLS or Service Role Key).`);
      }
      savedAgent = data;
    } else {
      const insertRow = {
        id: actualId,
        xp: 0,
        status: effectiveStatus,
        phases: phases || [],
        ...updatePayload
      };
      const { data, error } = await adminClient
        .from('agents')
        .upsert([insertRow], { onConflict: 'id' })
        .select()
        .maybeSingle();

      if (error) {
        throw new Error(`Database upsert failed: ${error.message}`);
      }
      savedAgent = data || insertRow;
    }

    return res.status(200).json({
      success: true,
      agent: savedAgent
    });
  } catch (err) {
    console.error('Failed to update agent:', err);
    return res.status(500).json({ error: err.message || 'Internal server error while updating agent.' });
  }
}
