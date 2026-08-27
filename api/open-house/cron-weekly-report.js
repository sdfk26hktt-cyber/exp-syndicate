import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const linqApiKey = process.env.LINQ_API_KEY || 'linq_8g9j8emFbtz7k9WUH4LY9Capp8Wo6no2';
const linqFromNumber = process.env.LINQ_FROM_NUMBER || '+19154947984';
const appBaseUrl = process.env.APP_BASE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://www.expsyndicate.com');

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export default async function handler(req, res) {
  // Check authorization header to verify Vercel Cron
  const authHeader = req.headers.authorization;
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    let settings = {
      deadline_day_of_week: 4, // Thursday
      deadline_time: '17:00',
      coordinator_phone: process.env.COORDINATOR_PHONE || '+19152566989',
      coordinator_name: 'Listing Coordinator'
    };

    if (supabase) {
      try {
        const { data } = await supabase
          .from('open_house_settings')
          .select('*')
          .eq('id', 'default')
          .single();
        if (data) settings = { ...settings, ...data };
      } catch (e) {
        console.debug('open_house_settings lookup:', e);
      }
    }

    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sun, 4 = Thu
    const currentHours = now.getHours();
    const [targetHour] = (settings.deadline_time || '17:00').split(':').map(Number);

    // If day matches and within current hour window (or if forced via ?force=true)
    const isDayMatch = currentDay === Number(settings.deadline_day_of_week);
    const isHourMatch = currentHours === targetHour;
    const isForce = req.query?.force === 'true';

    if (!isForce && (!isDayMatch || !isHourMatch)) {
      return res.status(200).json({
        skipped: true,
        reason: `Current time (${currentDay} @ ${currentHours}:00) does not match scheduled deadline (${settings.deadline_day_of_week} @ ${settings.deadline_time})`
      });
    }

    const reportUrl = `${appBaseUrl}/admin?tab=community&view=open-house-report`;
    const message = `📊 Hello ${settings.coordinator_name}, the weekly open house deadline has arrived. Your weekly Open House Report is ready to review: ${reportUrl}`;

    let linqStatus = 'simulated';
    if (linqApiKey && settings.coordinator_phone) {
      try {
        const cleanTo = settings.coordinator_phone.replace(/[^\d+]/g, '');
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
        if (linqRes.ok) linqStatus = 'sent';
      } catch (e) {
        console.warn('Cron Linq notification error:', e.message);
      }
    }

    if (supabase) {
      try {
        await supabase
          .from('open_house_settings')
          .upsert([{ id: 'default', last_report_sent_at: new Date().toISOString(), updated_at: new Date().toISOString() }], { onConflict: 'id' });
      } catch (e) {
        console.debug('open_house_settings upsert error:', e);
      }
    }

    return res.status(200).json({
      success: true,
      message,
      recipient: settings.coordinator_phone,
      linqStatus,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Error executing weekly report cron:', err);
    return res.status(500).json({ error: 'Internal cron error', message: err.message });
  }
}
