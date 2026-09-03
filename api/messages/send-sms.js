import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const linqApiKey = process.env.LINQ_API_KEY || 'linq_8g9j8emFbtz7k9WUH4LY9Capp8Wo6no2';
const linqFromNumber = process.env.LINQ_FROM_NUMBER || '+19154947984';

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// Normalize phone number to E.164 (+1...)
function normalizePhone(phone) {
  if (!phone) return null;
  const digits = String(phone).replace(/[^\d+]/g, '');
  if (!digits) return null;
  if (digits.startsWith('+')) return digits;
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return `+${digits}`;
}

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { recipients, message, groupName, senderName } = req.body || {};

  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Message content is required.' });
  }

  if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
    return res.status(400).json({ error: 'At least one recipient is required.' });
  }

  const cleanFrom = normalizePhone(linqFromNumber) || '+19154947984';
  const results = [];
  let sentCount = 0;
  let failedCount = 0;

  // Process all recipients
  const promises = recipients.map(async (rec) => {
    const rawPhone = rec.phone || (typeof rec === 'string' ? rec : '');
    const toPhone = normalizePhone(rawPhone);
    const fullName = rec.name || (rec.id ? String(rec.id).split('@')[0] : 'Agent');
    const firstName = fullName.split(' ')[0] || 'Agent';

    if (!toPhone) {
      failedCount++;
      results.push({
        recipient: fullName,
        phone: rawPhone,
        status: 'failed',
        error: 'Invalid or missing phone number'
      });
      return;
    }

    // Replace merge tags
    let personalizedMessage = message
      .replace(/{firstName}/gi, firstName)
      .replace(/{name}/gi, fullName)
      .replace(/{fullName}/gi, fullName)
      .replace(/{group}/gi, groupName || 'Syndicate')
      .replace(/{team}/gi, 'eXp Syndicate');

    try {
      const response = await fetch('https://api.linqapp.com/api/partner/v3/chats', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${linqApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: cleanFrom,
          to: [toPhone],
          message: {
            parts: [{ type: 'text', value: personalizedMessage }]
          }
        })
      });

      if (response.ok) {
        sentCount++;
        results.push({
          recipient: fullName,
          phone: toPhone,
          status: 'sent'
        });
      } else {
        const errText = await response.text();
        failedCount++;
        results.push({
          recipient: fullName,
          phone: toPhone,
          status: 'failed',
          error: `LinqApp API returned ${response.status}: ${errText}`
        });
      }
    } catch (err) {
      failedCount++;
      results.push({
        recipient: fullName,
        phone: toPhone,
        status: 'failed',
        error: err.message || 'Network error'
      });
    }
  });

  await Promise.allSettled(promises);

  // Optional: Record broadcast audit in Supabase
  try {
    if (supabase) {
      await supabase.from('sms_broadcast_logs').insert([{
        id: `sms-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        sender_name: senderName || 'Admin',
        group_name: groupName || 'Custom Selection',
        total_recipients: recipients.length,
        sent_count: sentCount,
        failed_count: failedCount,
        message_body: message,
        created_at: new Date().toISOString()
      }]).catch(() => {});
    }
  } catch (e) {
    console.debug('Optional SMS log write skipped:', e);
  }

  return res.status(200).json({
    success: true,
    sentCount,
    failedCount,
    totalRecipients: recipients.length,
    results
  });
}
