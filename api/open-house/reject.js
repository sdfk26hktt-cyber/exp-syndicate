import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const linqApiKey = process.env.LINQ_API_KEY;
const linqFromNumber = process.env.LINQ_FROM_NUMBER || '+19152566989';

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { bookingId, reason, reviewedBy } = req.body || {};

  if (!bookingId) {
    return res.status(400).json({ error: 'Missing bookingId' });
  }

  try {
    const reviewedAt = new Date().toISOString();
    const reviewer = reviewedBy || 'Listing Coordinator';
    const rejectionReason = reason || 'Declined by coordinator';

    let booking = null;
    let listing = null;

    if (supabase) {
      const { data: bData } = await supabase
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

      await supabase
        .from('open_house_bookings')
        .update({
          status: 'rejected',
          rejection_reason: rejectionReason,
          reviewed_at: reviewedAt,
          reviewed_by: reviewer
        })
        .eq('id', bookingId);
    }

    // Optional notification to agent if phone provided
    if (linqApiKey && booking?.agent_phone) {
      try {
        const address = listing?.address || 'Listing';
        const msg = `ℹ️ eXp Syndicate Open House Update: Your request for ${address} on ${booking.date} (${booking.start_time}-${booking.end_time}) was not approved. Note: ${rejectionReason}. Please check the portal to select another available slot!`;
        
        await fetch('https://api.linqapp.com/v1/messages', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${linqApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: linqFromNumber,
            to: booking.agent_phone,
            message: msg,
            preferred_service: 'auto'
          })
        });
      } catch (e) {
        console.warn('Optional Linq rejection text failed:', e.message);
      }
    }

    return res.status(200).json({
      success: true,
      bookingId,
      status: 'rejected',
      reason: rejectionReason,
      reviewedAt,
      reviewedBy: reviewer
    });
  } catch (err) {
    console.error('Error rejecting open house booking:', err);
    return res.status(500).json({ error: 'Internal server error', message: err.message });
  }
}
