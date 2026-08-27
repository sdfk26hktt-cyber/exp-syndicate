import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const linqApiKey = process.env.LINQ_API_KEY;
const linqFromNumber = process.env.LINQ_FROM_NUMBER || '+19152566989';
const appBaseUrl = process.env.APP_BASE_URL || process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://exp-syndicate.vercel.app';

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    let coordinatorPhone = process.env.COORDINATOR_PHONE || '+19152566989';
    let coordinatorName = 'Listing Coordinator';

    // Fetch settings from Supabase if available
    if (supabase) {
      const { data: settings } = await supabase
        .from('open_house_settings')
        .select('*')
        .eq('id', 'default')
        .single();

      if (settings) {
        if (settings.coordinator_phone) coordinatorPhone = settings.coordinator_phone;
        if (settings.coordinator_name) coordinatorName = settings.coordinator_name;
      }
    }

    const reportUrl = `${appBaseUrl}/admin?tab=community&view=open-house-report`;
    const message = `📊 Hello ${coordinatorName}, the weekly open house booking deadline has arrived. Your weekly Open House Schedule & Report is ready for review: ${reportUrl}`;

    let linqStatus = 'simulated';

    if (linqApiKey && coordinatorPhone) {
      try {
        const cleanTo = coordinatorPhone.replace(/[^\d+]/g, '');
        const normTo = cleanTo.startsWith('+') ? cleanTo : `+1${cleanTo}`;
        const cleanFrom = (linqFromNumber || '+19154947984').replace(/[^\d+]/g, '');
        const normFrom = cleanFrom.startsWith('+') ? cleanFrom : `+1${cleanFrom}`;

        const linqRes = await fetch('https://api.linqapp.com/api/partner/v3/chats', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${linqApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: normFrom,
            to: [normTo],
            message: {
              parts: [{ type: 'text', value: message }]
            }
          })
        });
        if (linqRes.ok) linqStatus = 'sent';
      } catch (e) {
        console.warn('LinqApp notification error:', e.message);
      }
    }

    // Update last_report_sent_at in settings
    if (supabase) {
      await supabase
        .from('open_house_settings')
        .upsert([
          {
            id: 'default',
            last_report_sent_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ], { onConflict: 'id' });
    }

    return res.status(200).json({
      success: true,
      recipient: coordinatorPhone,
      linqStatus,
      message,
      sentAt: new Date().toISOString()
    });
  } catch (err) {
    console.error('Error sending weekly report prompt:', err);
    return res.status(500).json({ error: 'Internal server error', message: err.message });
  }
}
