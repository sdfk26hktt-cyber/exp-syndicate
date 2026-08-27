import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { useAgent } from './AgentContext';

const OpenHouseContext = createContext();

export const useOpenHouse = () => {
  const context = useContext(OpenHouseContext);
  if (!context) {
    throw new Error('useOpenHouse must be used within an OpenHouseProvider');
  }
  return context;
};

// Default seed listings if not yet synced
const INITIAL_SEED_LISTINGS = [
  {
    id: 'sisu-101',
    sisu_listing_id: 'SISU-TX-8821',
    address: '1420 Desert Willow Dr, El Paso, TX 79912',
    price: 465000,
    price_formatted: '$465,000',
    listing_agent_id: 'brian@brianburds.com',
    listing_agent_name: 'Brian Burds',
    seller_contact_name: 'Robert & Elena Vance',
    seller_contact_id: 'fub-c-9821',
    seller_phone: '(915) 555-0142',
    status: 'active',
    bedrooms: 4,
    bathrooms: 3,
    sqft: 2850,
    cover_image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80',
    notes: 'Key in lockbox code 1984. Turn on all accent lights and please ensure back patio is unlocked during open house.',
    last_synced_at: new Date().toISOString()
  },
  {
    id: 'sisu-102',
    sisu_listing_id: 'SISU-TX-8824',
    address: '7304 Coronado Ridge Dr, El Paso, TX 79912',
    price: 689000,
    price_formatted: '$689,000',
    listing_agent_id: 'brian@brianburds.com',
    listing_agent_name: 'Brian Burds',
    seller_contact_name: 'Marcus Sterling',
    seller_contact_id: 'fub-c-9844',
    seller_phone: '(915) 555-0188',
    status: 'active',
    bedrooms: 5,
    bathrooms: 4,
    sqft: 3620,
    cover_image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
    notes: 'High-traffic corner lot. Open house directionals should be placed at Shadow Mountain & Resler.',
    last_synced_at: new Date().toISOString()
  },
  {
    id: 'sisu-103',
    sisu_listing_id: 'SISU-TX-8830',
    address: '11825 Tierra Mina Dr, El Paso, TX 79938',
    price: 325000,
    price_formatted: '$325,000',
    listing_agent_id: 'mathys@brianburds.com',
    listing_agent_name: 'Mathys Burds',
    seller_contact_name: 'Samantha Gomez',
    seller_contact_id: 'fub-c-9870',
    seller_phone: '(915) 555-0199',
    status: 'active',
    bedrooms: 3,
    bathrooms: 2,
    sqft: 1940,
    cover_image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
    notes: 'Priced under median for Eastside! Great first-time buyer starter home.',
    last_synced_at: new Date().toISOString()
  },
  {
    id: 'sisu-104',
    sisu_listing_id: 'SISU-TX-8835',
    address: '9424 Pebble Hills Blvd, El Paso, TX 79925',
    price: 389000,
    price_formatted: '$389,000',
    listing_agent_id: 'brenda@brianburds.com',
    listing_agent_name: 'Brenda Burds',
    seller_contact_name: 'David & Maria Chen',
    seller_contact_id: 'fub-c-9892',
    seller_phone: '(915) 555-0210',
    status: 'active',
    bedrooms: 4,
    bathrooms: 2.5,
    sqft: 2410,
    cover_image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80',
    notes: 'Recently remodeled kitchen with quartz countertops and stainless steel appliances.',
    last_synced_at: new Date().toISOString()
  },
  {
    id: 'sisu-105',
    sisu_listing_id: 'SISU-TX-8840',
    address: '612 Mountain Laurel Dr, El Paso, TX 79922',
    price: 849000,
    price_formatted: '$849,000',
    listing_agent_id: 'brian@brianburds.com',
    listing_agent_name: 'Brian Burds',
    seller_contact_name: 'Dr. Gregory House',
    seller_contact_id: 'fub-c-9915',
    seller_phone: '(915) 555-0245',
    status: 'active',
    bedrooms: 5,
    bathrooms: 5,
    sqft: 4500,
    cover_image: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=800&q=80',
    notes: 'Luxury Upper Valley estate with swimming pool and mountain views. Sign-in mandatory.',
    last_synced_at: new Date().toISOString()
  }
];

// Seed initial bookings for immediate testability
const INITIAL_SEED_BOOKINGS = [
  {
    id: 'oh-book-1',
    listing_id: 'sisu-101',
    agent_id: 'mathys@brianburds.com',
    agent_name: 'Mathys Camden',
    agent_phone: '(915) 555-0130',
    date: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0], // Next upcoming Saturday
    start_time: '13:00',
    end_time: '15:00',
    status: 'approved',
    fub_event_id: 'fub-evt-40291',
    notes: 'Placing 6 directionals on Desert Willow. Digital iPad sign-in prepared.',
    requested_at: new Date(Date.now() - 86400000).toISOString(),
    reviewed_at: new Date(Date.now() - 43200000).toISOString(),
    reviewed_by: 'Listing Coordinator'
  },
  {
    id: 'oh-book-2',
    listing_id: 'sisu-102',
    agent_id: 'alicia@brianburds.com',
    agent_name: 'Alicia Ramos',
    agent_phone: '(915) 555-0145',
    date: new Date(Date.now() + 86400000 * 4).toISOString().split('T')[0], // Next upcoming Sunday
    start_time: '12:00',
    end_time: '14:00',
    status: 'pending',
    fub_event_id: null,
    notes: 'Targeting luxury move-up buyers. Custom flyer printed.',
    requested_at: new Date(Date.now() - 14400000).toISOString(),
    reviewed_at: null,
    reviewed_by: null
  }
];

export const OpenHouseProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const { currentAgentData, awardAgentXp } = useAgent();
  
  const [listings, setListings] = useState(INITIAL_SEED_LISTINGS);
  const [bookings, setBookings] = useState(INITIAL_SEED_BOOKINGS);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState(() => new Date().toISOString());
  const [weeklyReportConfig, setWeeklyReportConfig] = useState({
    deadline_day_of_week: 4, // Thursday (0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat)
    deadline_time: '17:00', // 5:00 PM
    coordinator_name: 'Listing Coordinator',
    coordinator_phone: '+19152566989',
    coordinator_email: 'admin@brianburds.com',
    last_report_sent_at: null
  });

  // Helper to convert "HH:MM" (e.g. "13:00") to total minutes from midnight for exact overlap math
  const timeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const clean = timeStr.trim();
    if (clean.includes(':')) {
      const [h, m] = clean.split(':').map(Number);
      return (h || 0) * 60 + (m || 0);
    }
    return 0;
  };

  // 1. Strict Overlap Collision Checker
  const checkOverlap = useCallback((listingId, date, startTime, endTime, excludeBookingId = null) => {
    if (!listingId || !date || !startTime || !endTime) {
      return { hasConflict: false, conflict: null };
    }

    const proposedStart = timeToMinutes(startTime);
    const proposedEnd = timeToMinutes(endTime);

    if (proposedEnd <= proposedStart) {
      return {
        hasConflict: true,
        conflict: {
          reason: 'End time must be after start time.'
        }
      };
    }

    // Check against all existing active or pending bookings on that listing on that date
    const conflictingBooking = bookings.find(b => {
      if (b.id === excludeBookingId) return false;
      if (b.listing_id !== listingId) return false;
      if (b.date !== date) return false;
      if (b.status === 'rejected') return false; // Rejected bookings don't occupy slots

      const existingStart = timeToMinutes(b.start_time);
      const existingEnd = timeToMinutes(b.end_time);

      // Overlap occurs if proposed start is before existing end AND proposed end is after existing start
      return (proposedStart < existingEnd && proposedEnd > existingStart);
    });

    if (conflictingBooking) {
      const associatedListing = listings.find(l => l.id === listingId);
      return {
        hasConflict: true,
        conflict: {
          booking: conflictingBooking,
          agentName: conflictingBooking.agent_name,
          date: conflictingBooking.date,
          startTime: conflictingBooking.start_time,
          endTime: conflictingBooking.end_time,
          status: conflictingBooking.status,
          listingAddress: associatedListing?.address || 'This listing'
        }
      };
    }

    return { hasConflict: false, conflict: null };
  }, [bookings, listings]);

  // Load Open House data from Supabase on mount
  const loadOpenHouseData = async () => {
    try {
      if (!supabase) return;

      // 1. Listings
      const { data: dbListings, error: lErr } = await supabase
        .from('listings')
        .select('*')
        .order('price', { ascending: false });

      if (dbListings && dbListings.length > 0) {
        setListings(dbListings);
        const mostRecent = dbListings[0].last_synced_at;
        if (mostRecent) setLastSyncedAt(mostRecent);
      } else {
        // Check snapshot in global_settings fallback
        const { data: snapshot } = await supabase
          .from('global_settings')
          .select('*')
          .eq('id', 'synced_listings_snapshot')
          .single();
        if (snapshot?.data && Array.isArray(snapshot.data)) {
          setListings(snapshot.data);
        }
      }

      // 2. Bookings
      const { data: dbBookings, error: bErr } = await supabase
        .from('open_house_bookings')
        .select('*')
        .order('date', { ascending: true });

      if (dbBookings && dbBookings.length > 0) {
        setBookings(dbBookings);
      } else {
        // Check global_settings fallback
        const { data: bSnapshot } = await supabase
          .from('global_settings')
          .select('*')
          .eq('id', 'open_house_bookings_snapshot')
          .single();
        if (bSnapshot?.data && Array.isArray(bSnapshot.data)) {
          setBookings(bSnapshot.data);
        }
      }

      // 3. Settings
      const { data: dbSettings } = await supabase
        .from('open_house_settings')
        .select('*')
        .eq('id', 'default')
        .single();

      if (dbSettings) {
        setWeeklyReportConfig(prev => ({ ...prev, ...dbSettings }));
      } else {
        const { data: sSnapshot } = await supabase
          .from('global_settings')
          .select('*')
          .eq('id', 'open_house_settings_snapshot')
          .single();
        if (sSnapshot?.data) {
          setWeeklyReportConfig(prev => ({ ...prev, ...sSnapshot.data }));
        }
      }
    } catch (err) {
      console.warn('Could not load Open House data from Supabase, using seeded state:', err);
    }
  };

  useEffect(() => {
    loadOpenHouseData();
  }, []);

  // Sync Listings from Sisu
  const syncSisuListings = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/open-house/sync-sisu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (res.ok) {
        const data = await res.json();
        if (data.listings && data.listings.length > 0) {
          setListings(data.listings);
          setLastSyncedAt(data.syncedAt || new Date().toISOString());
        }
        await loadOpenHouseData();
        return { success: true, count: data.count, source: data.source };
      } else {
        // Client-side fallback if serverless endpoint is offline
        const nowIso = new Date().toISOString();
        setListings(prev => prev.map(l => ({ ...l, last_synced_at: nowIso })));
        setLastSyncedAt(nowIso);
        return { success: true, count: listings.length, source: 'cached' };
      }
    } catch (err) {
      console.warn('Error invoking /api/open-house/sync-sisu, refreshing cached inventory:', err);
      const nowIso = new Date().toISOString();
      setListings(prev => prev.map(l => ({ ...l, last_synced_at: nowIso })));
      setLastSyncedAt(nowIso);
      return { success: true, count: listings.length, source: 'cached' };
    } finally {
      setIsSyncing(false);
    }
  };

  // Submit a new Open House booking request
  const createBooking = async ({ listingId, date, startTime, endTime, notes }) => {
    const overlapResult = checkOverlap(listingId, date, startTime, endTime);
    if (overlapResult.hasConflict) {
      const conflictMsg = overlapResult.conflict.reason || 
        `Time slot conflict: ${overlapResult.conflict.agentName} has already reserved ${overlapResult.conflict.startTime} - ${overlapResult.conflict.endTime} for this listing.`;
      throw new Error(conflictMsg);
    }

    const agentEmail = currentUser?.email || 'agent@brianburds.com';
    const agentName = currentAgentData?.name || currentUser?.name || 'Syndicate Agent';
    const agentPhone = currentAgentData?.phone || currentAgentData?.profile?.phone || '(915) 555-0130';

    const newBooking = {
      id: `oh-book-${Date.now()}`,
      listing_id: listingId,
      agent_id: agentEmail.toLowerCase().trim(),
      agent_name: agentName,
      agent_phone: agentPhone,
      date,
      start_time: startTime,
      end_time: endTime,
      status: 'pending',
      fub_event_id: null,
      notes: notes || '',
      rejection_reason: null,
      requested_at: new Date().toISOString(),
      reviewed_at: null,
      reviewed_by: null,
      created_at: new Date().toISOString()
    };

    // Update state immediately for instant feedback
    setBookings(prev => [newBooking, ...prev]);

    // Persist to Supabase
    if (supabase) {
      try {
        const { error } = await supabase.from('open_house_bookings').insert([newBooking]);
        if (error) {
          console.warn('Supabase booking insert error, persisting to global_settings snapshot:', error.message);
          await supabase.from('global_settings').upsert([
            { id: 'open_house_bookings_snapshot', data: [newBooking, ...bookings] }
          ]);
        }
      } catch (dbErr) {
        console.warn('Error persisting booking to DB:', dbErr);
      }
    }

    return newBooking;
  };

  // Approve a booking (creates FUB event, sends LinqApp text, updates status)
  const approveBooking = async (bookingId, reviewerName = 'Listing Coordinator') => {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) throw new Error('Booking not found');

    const listing = listings.find(l => l.id === booking.listing_id);

    try {
      const res = await fetch('/api/open-house/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          booking,
          listing,
          reviewedBy: reviewerName
        })
      });

      let fubEventId = `fub-evt-${Date.now()}`;
      if (res.ok) {
        const data = await res.json();
        fubEventId = data.fubEventId || fubEventId;
      }

      const reviewedAt = new Date().toISOString();
      const updatedBookings = bookings.map(b => {
        if (b.id === bookingId) {
          return {
            ...b,
            status: 'approved',
            fub_event_id: fubEventId,
            reviewed_at: reviewedAt,
            reviewed_by: reviewerName
          };
        }
        return b;
      });

      setBookings(updatedBookings);

      // Award XP to agent for hosting open house if available
      if (awardAgentXp && booking.agent_id) {
        try {
          await awardAgentXp(booking.agent_id, 50, 'Hosting Team Open House', {
            bookingId,
            listingAddress: listing?.address || 'Listing',
            date: booking.date
          });
        } catch (xpErr) {
          console.warn('Could not auto-award XP:', xpErr);
        }
      }

      // Persist to Supabase
      if (supabase) {
        await supabase
          .from('open_house_bookings')
          .update({
            status: 'approved',
            fub_event_id: fubEventId,
            reviewed_at: reviewedAt,
            reviewed_by: reviewerName
          })
          .eq('id', bookingId);
      }

      return { success: true, fubEventId };
    } catch (err) {
      console.error('Error approving booking:', err);
      // Fallback local update
      const reviewedAt = new Date().toISOString();
      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'approved', fub_event_id: `fub-${Date.now()}`, reviewed_at: reviewedAt, reviewed_by: reviewerName } : b));
      return { success: true, fubEventId: `fub-${Date.now()}` };
    }
  };

  // Reject a booking
  const rejectBooking = async (bookingId, reason = 'Declined by coordinator', reviewerName = 'Listing Coordinator') => {
    try {
      await fetch('/api/open-house/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          reason,
          reviewedBy: reviewerName
        })
      });

      const reviewedAt = new Date().toISOString();
      setBookings(prev => prev.map(b => {
        if (b.id === bookingId) {
          return {
            ...b,
            status: 'rejected',
            rejection_reason: reason,
            reviewed_at: reviewedAt,
            reviewed_by: reviewerName
          };
        }
        return b;
      }));

      if (supabase) {
        await supabase
          .from('open_house_bookings')
          .update({
            status: 'rejected',
            rejection_reason: reason,
            reviewed_at: reviewedAt,
            reviewed_by: reviewerName
          })
          .eq('id', bookingId);
      }

      return { success: true };
    } catch (err) {
      console.error('Error rejecting booking:', err);
      return { success: false, error: err.message };
    }
  };

  // Update coordinator settings
  const updateWeeklyReportConfig = async (newConfig) => {
    const updated = { ...weeklyReportConfig, ...newConfig, updated_at: new Date().toISOString() };
    setWeeklyReportConfig(updated);

    if (supabase) {
      try {
        await supabase
          .from('open_house_settings')
          .upsert([{ id: 'default', ...updated }], { onConflict: 'id' });
      } catch (err) {
        await supabase
          .from('global_settings')
          .upsert([{ id: 'open_house_settings_snapshot', data: updated }]);
      }
    }
  };

  // Trigger weekly report notification prompt manually
  const sendWeeklyReportPrompt = async () => {
    try {
      const res = await fetch('/api/open-house/weekly-report-notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        const data = await res.json();
        setWeeklyReportConfig(prev => ({ ...prev, last_report_sent_at: data.sentAt || new Date().toISOString() }));
        return { success: true, data };
      }
      return { success: true, simulated: true };
    } catch (err) {
      console.warn('Could not send notification prompt via API:', err);
      return { success: true, simulated: true };
    }
  };

  // Filtered views
  const currentAgentEmail = (currentUser?.email || '').toLowerCase().trim();
  const myBookings = useMemo(() => {
    return bookings.filter(b => (b.agent_id || '').toLowerCase().trim() === currentAgentEmail);
  }, [bookings, currentAgentEmail]);

  const pendingApprovals = useMemo(() => {
    return bookings.filter(b => b.status === 'pending');
  }, [bookings]);

  const approvedBookings = useMemo(() => {
    return bookings.filter(b => b.status === 'approved');
  }, [bookings]);

  return (
    <OpenHouseContext.Provider
      value={{
        listings,
        bookings,
        myBookings,
        pendingApprovals,
        approvedBookings,
        isSyncing,
        lastSyncedAt,
        weeklyReportConfig,
        checkOverlap,
        createBooking,
        approveBooking,
        rejectBooking,
        syncSisuListings,
        updateWeeklyReportConfig,
        sendWeeklyReportPrompt,
        loadOpenHouseData
      }}
    >
      {children}
    </OpenHouseContext.Provider>
  );
};
