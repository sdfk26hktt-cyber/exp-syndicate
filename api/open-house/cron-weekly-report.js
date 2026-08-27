import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const linqApiKey = process.env.LINQ_API_KEY;
const linqFromNumber = process.env.LINQ_FROM_NUMBER || '+19152566989';
const appBaseUrl = process.env.APP_BASE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://exp-syndicate.vercel.app');

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
      const { data } = await supabase
        .from('open_house_settings')
        .select('*')
        .eq('id', 'default')
        .single();
      if (data) settings = { ...settings, ...data };
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
        const linqRes = await fetch('https://api.linqapp.com/v1/messages', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${linqApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: linqFromNumber,
            to: settings.coordinator_phone,
            message,
            preferred_service: 'auto'
          })
        });
        if (linqRes.ok) linqStatus = 'sent';
      } catch (e) {
        console.warn('Cron Linq notification error:', e.message);
      }
    }

    if (supabase) {
      await supabase
        .from('open_house_settings')
        .upsert([{ id: 'default', last_report_sent_at: new Date().toISOString(), updated_at: new Date().toISOString() }], { onConflict: 'id' });
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
