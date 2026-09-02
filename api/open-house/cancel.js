import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const fubApiKey = process.env.FUB_API_KEY || 'fka_0GE0sHDxHWDK9pfJSqkQw2Y23Fme0R2mUS';
const fubSystemName = process.env.FUB_SYSTEM_NAME || 'eXp Syndicate Portal';
const fubSystemKey = process.env.FUB_SYSTEM_KEY || 'expsyndicate-open-house';
const linqApiKey = process.env.LINQ_API_KEY || 'linq_8g9j8emFbtz7k9WUH4LY9Capp8Wo6no2';
const linqFromNumber = process.env.LINQ_FROM_NUMBER || '+19154947984';

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { bookingId, reason, cancelledBy, booking: passedBooking, listing: passedListing } = req.body || {};

  if (!bookingId) {
    return res.status(400).json({ error: 'Missing bookingId' });
  }

  try {
    const cancelledAt = new Date().toISOString();
    const canceller = cancelledBy || 'Coordinator / Agent';
    const cancelReason = reason || 'Schedule adjustment';

    let booking = passedBooking || null;
    let listing = passedListing || null;

    if (supabase) {
      if (!booking) {
        const { data: bData } = await supabase
          .from('open_house_bookings')
          .select('*')
          .eq('id', bookingId)
          .single();
        if (bData) booking = bData;
      }

      if (booking && !listing) {
        const { data: lData } = await supabase
          .from('listings')
          .select('*')
          .eq('id', booking.listing_id)
          .single();
        if (lData) listing = lData;
      }

      try {
        await supabase
          .from('open_house_bookings')
          .update({
            status: 'cancelled',
            cancellation_reason: cancelReason,
            cancelled_at: cancelledAt,
            cancelled_by: canceller
          })
          .eq('id', bookingId);
      } catch (dbUpdateErr) {
        console.debug('open_house_bookings table update notice:', dbUpdateErr);
      }
    }

    const listingAddress = listing?.address || booking?.listing_address || 'Listing Address';
    const dateFormatted = booking?.date || '';
    const timeRange = booking ? `${booking.start_time} - ${booking.end_time}` : '';
    const agentName = booking?.agent_name || 'Agent';
    const agentPhone = booking?.agent_phone || '';
    const sellerName = listing?.seller_contact_name || booking?.seller_contact_name || 'Seller';
    const sellerContactId = listing?.seller_contact_id || booking?.seller_contact_id || null;
    const fubEventId = booking?.fub_event_id;

    let fubDeleted = false;

    // 1. Delete appointment from Follow Up Boss if active appointment ID exists
    if (fubApiKey && fubEventId) {
      const cleanFubId = String(fubEventId).replace(/\D/g, '');
      if (cleanFubId) {
        try {
          const authHeader = `Basic ${Buffer.from(`${fubApiKey}:`).toString('base64')}`;
          const delRes = await fetch(`https://api.followupboss.com/v1/appointments/${cleanFubId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': authHeader,
              'X-System': fubSystemName,
              'X-System-Key': fubSystemKey
            },
            signal: AbortSignal.timeout(5000)
          });
          fubDeleted = delRes.ok || delRes.status === 204 || delRes.status === 404;
        } catch (fubDelErr) {
          console.warn('FUB appointment deletion error:', fubDelErr.message);
        }
      }

      // Log a cancellation event on the seller contact timeline in FUB
      try {
        const authHeader = `Basic ${Buffer.from(`${fubApiKey}:`).toString('base64')}`;
        const eventPayload = {
          source: fubSystemName,
          system: fubSystemName,
          type: 'General',
          message: `Open House CANCELLED: ${listingAddress} on ${dateFormatted} (${timeRange}) by ${canceller}. Reason: ${cancelReason}`,
          person: {
            contacted: false,
            name: sellerName
          }
        };

        await fetch('https://api.followupboss.com/v1/events', {
          method: 'POST',
          headers: {
            'Authorization': authHeader,
            'X-System': fubSystemName,
            'X-System-Key': fubSystemKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(eventPayload),
          signal: AbortSignal.timeout(5000)
        });
      } catch (fubLogErr) {
        console.warn('FUB cancellation event log notice:', fubLogErr.message);
      }
    }

    // 2. LinqApp Text Notification to hosting agent
    if (linqApiKey && agentPhone) {
      try {
        const msg = `⚠️ eXp Syndicate Open House Update: The Open House for ${listingAddress} on ${dateFormatted} (${timeRange}) has been CANCELLED. Reason: ${cancelReason}`;
        const cleanTo = agentPhone.replace(/[^\d+]/g, '');
        const normTo = cleanTo.startsWith('+') ? cleanTo : (cleanTo.length === 10 ? `+1${cleanTo}` : `+${cleanTo}`);
        const cleanFrom = (linqFromNumber || '+19154947984').replace(/[^\d+]/g, '');
        const normFrom = cleanFrom.startsWith('+') ? cleanFrom : `+1${cleanFrom}`;

        await fetch('https://api.linqapp.com/api/partner/v3/chats', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${linqApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: normFrom,
            to: [normTo],
            message: {
              parts: [{ type: 'text', value: msg }]
            }
          }),
          signal: AbortSignal.timeout(5000)
        });
      } catch (linqErr) {
        console.warn('LinqApp cancellation SMS notice:', linqErr.message);
      }
    }

    return res.status(200).json({
      success: true,
      bookingId,
      status: 'cancelled',
      reason: cancelReason,
      cancelledAt,
      cancelledBy: canceller,
      fubDeleted
    });
  } catch (err) {
    console.error('Error cancelling open house booking:', err);
    return res.status(500).json({ error: 'Internal server error', message: err.message });
  }
}
