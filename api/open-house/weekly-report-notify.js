import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const linqApiKey = process.env.LINQ_API_KEY || 'linq_8g9j8emFbtz7k9WUH4LY9Capp8Wo6no2';
const linqFromNumber = process.env.LINQ_FROM_NUMBER || '+19154947984';
const appBaseUrl = process.env.APP_BASE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://www.expsyndicate.com');

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body || {};
    let coordinatorPhone = body.coordinatorPhone || body.phone || process.env.COORDINATOR_PHONE || '+19152566989';
    let coordinatorName = body.coordinatorName || body.name || 'Listing Coordinator';

    // Fetch settings from Supabase if not explicitly in body
    if (supabase && (!body.coordinatorPhone || !body.coordinatorName)) {
      try {
        const { data: settings } = await supabase
          .from('open_house_settings')
          .select('*')
          .eq('id', 'default')
          .single();

        if (settings) {
          if (!body.coordinatorPhone && settings.coordinator_phone) coordinatorPhone = settings.coordinator_phone;
          if (!body.coordinatorName && settings.coordinator_name) coordinatorName = settings.coordinator_name;
        }
      } catch (e) {
        console.debug('open_house_settings lookup:', e);
      }
    }

    const reportUrl = `${appBaseUrl}/admin?tab=community&view=open-house-report`;
    const message = `📊 Hello ${coordinatorName}, the weekly open house booking deadline has arrived. Your weekly Open House Schedule & Report is ready for review: ${reportUrl}`;

    let linqStatus = 'failed';
    let linqResponseData = null;
    let linqError = null;

    if (linqApiKey && coordinatorPhone) {
      try {
        const cleanTo = coordinatorPhone.replace(/[^\d+]/g, '');
        const normTo = cleanTo.startsWith('+') ? cleanTo : (cleanTo.length === 10 ? `+1${cleanTo}` : `+${cleanTo}`);
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

        const resText = await linqRes.text();
        try {
          linqResponseData = JSON.parse(resText);
        } catch {
          linqResponseData = resText;
        }

        if (linqRes.ok) {
          linqStatus = 'sent';
        } else {
          linqError = `Linq HTTP ${linqRes.status}: ${resText}`;
          console.warn('LinqApp error response:', linqError);
        }
      } catch (e) {
        linqError = e.message;
        console.warn('LinqApp notification error:', e.message);
      }
    } else {
      linqError = 'Missing Linq API key or recipient phone number';
    }

    // Update last_report_sent_at in settings
    if (supabase) {
      try {
        await supabase
          .from('open_house_settings')
          .upsert([
            {
              id: 'default',
              last_report_sent_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          ], { onConflict: 'id' });
      } catch (e) {
        console.debug('open_house_settings upsert error:', e);
      }
    }

    return res.status(200).json({
      success: linqStatus === 'sent',
      recipient: coordinatorPhone,
      linqStatus,
      linqError,
      linqResponse: linqResponseData,
      message,
      sentAt: new Date().toISOString()
    });
  } catch (err) {
    console.error('Error sending weekly report prompt:', err);
    return res.status(500).json({ error: 'Internal server error', message: err.message });
  }
}
