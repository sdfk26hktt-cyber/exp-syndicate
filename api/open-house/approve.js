import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

// API Keys
const fubApiKey = process.env.FUB_API_KEY;
const fubSystemName = process.env.FUB_SYSTEM_NAME || 'eXp Syndicate Dashboard';
const fubSystemKey = process.env.FUB_SYSTEM_KEY || 'exp-syndicate';
const linqApiKey = process.env.LINQ_API_KEY;
const linqFromNumber = process.env.LINQ_FROM_NUMBER || '+19152566989';

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { bookingId, reviewedBy } = req.body || {};

  if (!bookingId) {
    return res.status(400).json({ error: 'Missing bookingId parameter' });
  }

  try {
    let booking = null;
    let listing = null;

    // Fetch booking and listing from Supabase
    if (supabase) {
      const { data: bData, error: bErr } = await supabase
        .from('open_house_bookings')
        .select('*')
        .eq('id', bookingId)
        .single();

      if (bData) {
        booking = bData;
        const { data: lData } = await supabase
          .from('listings')
          .select('*')
          .eq('id', bData.listing_id)
          .single();
        listing = lData;
      }
    }

    // Fallback if booking wasn't in db yet (passed directly in payload)
    if (!booking && req.body.booking) {
      booking = req.body.booking;
      listing = req.body.listing;
    }

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const reviewer = reviewedBy || 'Listing Coordinator';
    const listingAddress = listing?.address || booking.listing_address || 'Listing Address';
    const dateFormatted = booking.date; // YYYY-MM-DD
    const timeRange = `${booking.start_time} - ${booking.end_time}`;
    const agentName = booking.agent_name || 'Agent';
    const agentPhone = booking.agent_phone || '';
    const sellerName = listing?.seller_contact_name || 'Seller';
    const sellerContactId = listing?.seller_contact_id || null;

    let fubEventId = `fub-evt-${Date.now()}`;
    let fubStatus = 'simulated';
    let linqAgentStatus = 'simulated';
    let linqCoordinatorStatus = 'simulated';

    // 1. Follow Up Boss Event / Appointment Creation
    if (fubApiKey) {
      try {
        const authHeader = `Basic ${Buffer.from(`${fubApiKey}:`).toString('base64')}`;
        
        // Build ISO start & end times
        const startIso = `${booking.date}T${booking.start_time}:00`;
        const endIso = `${booking.date}T${booking.end_time}:00`;

        const appointmentPayload = {
          title: `Open House: ${listingAddress}`,
          start: startIso,
          end: endIso,
          location: listingAddress,
          description: `eXp Syndicate Open House\nHosting Agent: ${agentName} (${booking.agent_id})\nSeller: ${sellerName}\nNotes: ${booking.notes || 'None'}\nApproved By: ${reviewer}`,
          type: 'Open House',
          personId: sellerContactId ? Number(sellerContactId.replace(/\D/g, '')) || undefined : undefined
        };

        const fubRes = await fetch('https://api.followupboss.com/v1/appointments', {
          method: 'POST',
          headers: {
            'Authorization': authHeader,
            'X-System': fubSystemName,
            'X-System-Key': fubSystemKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(appointmentPayload)
        });

        if (fubRes.ok) {
          const fubData = await fubRes.json();
          fubEventId = String(fubData.id || fubData.appointment?.id || fubEventId);
          fubStatus = 'created';
        } else {
          console.warn(`FUB API appointment returned ${fubRes.status}, falling back to event API.`);
          // Try /v1/events as fallback
          const eventPayload = {
            source: fubSystemName,
            system: fubSystemName,
            type: 'General',
            message: `Open House Scheduled: ${listingAddress} on ${dateFormatted} (${timeRange}) by ${agentName}`,
            person: {
              contacted: false,
              name: sellerName
            }
          };
          const evtRes = await fetch('https://api.followupboss.com/v1/events', {
            method: 'POST',
            headers: {
              'Authorization': authHeader,
              'X-System': fubSystemName,
              'X-System-Key': fubSystemKey,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(eventPayload)
          });
          if (evtRes.ok) {
            const evtData = await evtRes.json();
            fubEventId = String(evtData.id || fubEventId);
            fubStatus = 'event_logged';
          }
        }
      } catch (fubErr) {
        console.warn('FUB API integration error:', fubErr.message);
      }
    }

    // 2. LinqApp Text Notifications
    const agentMsg = `🏠 eXp Syndicate: Your Open House booking for ${listingAddress} on ${dateFormatted} (${timeRange}) has been APPROVED! The event is now live on the Follow Up Boss calendar. Good luck with the open house!`;
    const coordinatorMsg = `✅ Open House Approved: ${agentName} is confirmed for ${listingAddress} on ${dateFormatted} (${timeRange}). FUB Event: ${fubEventId}`;

    if (linqApiKey) {
      const sendLinq = async (toPhone, text) => {
        if (!toPhone || !text) return false;
        const cleanTo = toPhone.replace(/[^\d+]/g, '');
        const normTo = cleanTo.startsWith('+') ? cleanTo : `+1${cleanTo}`;
        const cleanFrom = (linqFromNumber || '+19154947984').replace(/[^\d+]/g, '');
        const normFrom = cleanFrom.startsWith('+') ? cleanFrom : `+1${cleanFrom}`;

        try {
          const res = await fetch('https://api.linqapp.com/api/partner/v3/chats', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${linqApiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              from: normFrom,
              to: [normTo],
              message: {
                parts: [{ type: 'text', value: text }]
              }
            })
          });
          return res.ok;
        } catch (e) {
          console.warn('LinqApp error:', e.message);
          return false;
        }
      };

      // Send to agent
      if (agentPhone) {
        const ok = await sendLinq(agentPhone, agentMsg);
        if (ok) linqAgentStatus = 'sent';
      }

      // Send to coordinator
      const coordPhone = process.env.COORDINATOR_PHONE || '+19154947984';
      const ok2 = await sendLinq(coordPhone, coordinatorMsg);
      if (ok2) linqCoordinatorStatus = 'sent';
    }

    // 3. Update Supabase record
    const reviewedAt = new Date().toISOString();
    if (supabase) {
      await supabase
        .from('open_house_bookings')
        .update({
          status: 'approved',
          fub_event_id: fubEventId,
          reviewed_at: reviewedAt,
          reviewed_by: reviewer
        })
        .eq('id', bookingId);
    }

    return res.status(200).json({
      success: true,
      bookingId,
      status: 'approved',
      fubEventId,
      fubStatus,
      fubLeadId: sellerContactId,
      fubLeadUrl: sellerContactId ? `https://brianburds.followupboss.com/2/people/view/${sellerContactId}` : null,
      notifications: {
        agent: { status: linqAgentStatus, message: agentMsg },
        coordinator: { status: linqCoordinatorStatus, message: coordinatorMsg }
      },
      reviewedAt,
      reviewedBy: reviewer
    });
  } catch (err) {
    console.error('Error approving open house booking:', err);
    return res.status(500).json({ error: 'Internal server error', message: err.message });
  }
}
