/**
 * Open House Bookings <-> Supabase Events Table Sync Utility
 */

export function bookingToEvent(b) {
  return {
    id: b.id,
    title: `Open House: ${b.listing_address || 'Listing'}`,
    date: b.date,
    time: b.start_time,
    end_time: b.end_time,
    location: b.listing_address || '',
    description: JSON.stringify({
      bookingId: b.id,
      listingId: b.listing_id,
      listingAddress: b.listing_address,
      listingPrice: b.listing_price,
      listingAgentName: b.listing_agent_name,
      sellerContactId: b.seller_contact_id,
      sellerContactName: b.seller_contact_name,
      agentId: b.agent_id,
      agentName: b.agent_name,
      agentPhone: b.agent_phone,
      notes: b.notes,
      fubEventId: b.fub_event_id,
      rejectionReason: b.rejection_reason,
      requestedAt: b.requested_at,
      reviewedAt: b.reviewed_at,
      reviewedBy: b.reviewed_by
    }),
    status: b.status || 'pending',
    type: 'Open House Request',
    attendees: [],
    instructor: b.listing_agent_name || null,
    submitted_by: b.agent_id || b.agent_name || null
  };
}

export function eventToBooking(e) {
  let meta = {};
  try {
    if (e.description && typeof e.description === 'string' && e.description.startsWith('{')) {
      meta = JSON.parse(e.description);
    }
  } catch (err) {
    console.debug('Error parsing event description JSON:', err);
  }

  return {
    id: meta.bookingId || e.id,
    listing_id: meta.listingId || '',
    listing_address: meta.listingAddress || e.location || '',
    listing_price: meta.listingPrice || '',
    listing_agent_name: meta.listingAgentName || e.instructor || '',
    seller_contact_id: meta.sellerContactId || null,
    seller_contact_name: meta.sellerContactName || '',
    agent_id: meta.agentId || e.submitted_by || '',
    agent_name: meta.agentName || e.submitted_by || 'Agent',
    agent_phone: meta.agentPhone || '',
    date: e.date,
    start_time: e.time,
    end_time: e.end_time,
    status: e.status || 'pending',
    fub_event_id: meta.fubEventId || null,
    notes: meta.notes || (e.description?.startsWith('{') ? '' : e.description) || '',
    rejection_reason: meta.rejectionReason || null,
    requested_at: meta.requestedAt || new Date().toISOString(),
    reviewed_at: meta.reviewedAt || null,
    reviewed_by: meta.reviewedBy || null,
    created_at: meta.requestedAt || new Date().toISOString()
  };
}
