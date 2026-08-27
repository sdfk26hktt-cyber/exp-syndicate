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

import { INITIAL_SEED_LISTINGS } from '../utils/seedListings';
import { bookingToEvent, eventToBooking } from '../utils/openHouseEvents';

// Seed initial bookings for immediate testability with real team listings
const INITIAL_SEED_BOOKINGS = [
  {
    id: 'oh-book-1',
    listing_id: 'fub-sisu-4245',
    listing_address: '304 Rio Pinsaqui Ct, El Paso, TX 79932',
    listing_price: '$680,000',
    listing_agent_name: 'Angelica Lopez',
    seller_contact_id: '64948',
    seller_contact_name: 'Elilina Alba',
    agent_id: 'melissa@brianburds.com',
    agent_name: 'Melissa Hernandez',
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
    listing_id: 'fub-sisu-4723',
    listing_address: '1076 Haper Ct, El Paso, TX 79932',
    listing_price: '$290,000',
    listing_agent_name: 'Carmen Luna',
    seller_contact_id: '66319',
    seller_contact_name: 'Alejandro Fierro',
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
  
  const [listings, setListings] = useState(() => {
    try {
      const saved = localStorage.getItem('syndicate_open_house_listings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.debug('OpenHouseContext: using default listings', e);
    }
    return INITIAL_SEED_LISTINGS;
  });

  const [bookings, setBookings] = useState(() => {
    try {
      const saved = localStorage.getItem('syndicate_open_house_bookings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.debug('OpenHouseContext: using default bookings', e);
    }
    return INITIAL_SEED_BOOKINGS;
  });

  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState(() => {
    try {
      return localStorage.getItem('syndicate_open_house_last_synced') || new Date().toISOString();
    } catch (e) {
      console.debug('OpenHouseContext: using current timestamp for lastSyncedAt', e);
      return new Date().toISOString();
    }
  });

  const [weeklyReportConfig, setWeeklyReportConfig] = useState(() => {
    const defaultConfig = {
      deadline_day_of_week: 4, // Thursday (0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat)
      deadline_time: '17:00', // 5:00 PM
      coordinator_name: 'Listing Coordinator',
      coordinator_phone: '+1 (915) 256-6989',
      coordinator_email: 'admin@brianburds.com',
      linq_sender_phone: '+1 (915) 494-7984',
      last_report_sent_at: null
    };
    try {
      const saved = localStorage.getItem('syndicate_open_house_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        // If saved phone is accidentally set to the sender number, default to recipient number
        if (parsed.coordinator_phone && (parsed.coordinator_phone.replace(/\D/g, '') === '19154947984' || parsed.coordinator_phone.replace(/\D/g, '') === '9154947984')) {
          parsed.coordinator_phone = '+1 (915) 256-6989';
        }
        return { ...defaultConfig, ...parsed };
      }
    } catch (e) {
      console.debug('OpenHouseContext: using default weeklyReportConfig', e);
    }
    return defaultConfig;
  });

  // Save bookings to localStorage whenever changed
  const persistBookings = (newBookings) => {
    setBookings(newBookings);
    try {
      localStorage.setItem('syndicate_open_house_bookings', JSON.stringify(newBookings));
    } catch (e) {
      console.warn('Could not persist open house bookings to localStorage:', e);
    }
  };

  const persistListings = (newListings) => {
    setListings(newListings);
    try {
      localStorage.setItem('syndicate_open_house_listings', JSON.stringify(newListings));
    } catch (e) {
      console.warn('Could not persist open house listings to localStorage:', e);
    }
  };

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
      const { data: dbListings } = await supabase
        .from('listings')
        .select('*')
        .order('price', { ascending: false });

      if (dbListings && dbListings.length > 0) {
        persistListings(dbListings);
        const mostRecent = dbListings[0].last_synced_at;
        if (mostRecent) {
          setLastSyncedAt(mostRecent);
          try { localStorage.setItem('syndicate_open_house_last_synced', mostRecent); } catch (e) { console.debug(e); }
        }
      } else {
        // Check snapshot in global_settings fallback
        const { data: snapshot } = await supabase
          .from('global_settings')
          .select('*')
          .eq('id', 'synced_listings_snapshot')
          .single();
        if (snapshot?.data && Array.isArray(snapshot.data)) {
          persistListings(snapshot.data);
        }
      }

      // 2. Bookings - Query from live Supabase events table
      try {
        const { data: dbEvents, error: evtErr } = await supabase
          .from('events')
          .select('*')
          .or('type.eq.Open House Request,type.eq.Open House,id.like.oh-%')
          .order('date', { ascending: true });

        if (dbEvents && dbEvents.length > 0) {
          const parsedRemote = dbEvents.map(eventToBooking);
          const merged = [...parsedRemote];
          // Keep any local initial seed bookings that haven't conflicted
          INITIAL_SEED_BOOKINGS.forEach(seedB => {
            if (!merged.some(m => m.id === seedB.id || (m.listing_id === seedB.listing_id && m.date === seedB.date && m.start_time === seedB.start_time))) {
              merged.push(seedB);
            }
          });
          persistBookings(merged);
        }
      } catch (evtQueryErr) {
        console.warn('Could not query events table for open house bookings:', evtQueryErr);
      }

      // 3. Settings fallback
      try {
        const { data: dbSettings } = await supabase
          .from('open_house_settings')
          .select('*')
          .eq('id', 'default')
          .single();

        if (dbSettings) {
          const nextCfg = { ...weeklyReportConfig, ...dbSettings };
          setWeeklyReportConfig(nextCfg);
          try { localStorage.setItem('syndicate_open_house_config', JSON.stringify(nextCfg)); } catch (e) { console.debug(e); }
        }
      } catch (cfgErr) {
        console.debug('Using local weekly report configuration', cfgErr);
      }
    } catch (err) {
      console.warn('Could not load Open House data from Supabase, using cached state:', err);
    }
  };

  useEffect(() => {
    loadOpenHouseData();

    // Real-time listener for instant cross-device updates between Agent and Admin
    if (supabase) {
      try {
        const channel = supabase
          .channel('open_house_realtime_events')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'events' },
            () => {
              loadOpenHouseData();
            }
          )
          .subscribe();

        return () => {
          supabase.removeChannel(channel);
        };
      } catch (subErr) {
        console.debug('Supabase realtime subscription fallback:', subErr);
      }
    }
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
          persistListings(data.listings);
          const syncedTime = data.syncedAt || new Date().toISOString();
          setLastSyncedAt(syncedTime);
          try { localStorage.setItem('syndicate_open_house_last_synced', syncedTime); } catch (e) { console.debug(e); }
        }
        await loadOpenHouseData();
        return { success: true, count: data.count, source: data.source };
      } else {
        // Client-side fallback if serverless endpoint is offline
        const nowIso = new Date().toISOString();
        const updated = listings.map(l => ({ ...l, last_synced_at: nowIso }));
        persistListings(updated);
        setLastSyncedAt(nowIso);
        try { localStorage.setItem('syndicate_open_house_last_synced', nowIso); } catch (e) { console.debug(e); }
        return { success: true, count: listings.length, source: 'cached' };
      }
    } catch (err) {
      console.warn('Error invoking /api/open-house/sync-sisu, refreshing cached inventory:', err);
      const nowIso = new Date().toISOString();
      const updated = listings.map(l => ({ ...l, last_synced_at: nowIso }));
      persistListings(updated);
      setLastSyncedAt(nowIso);
      try { localStorage.setItem('syndicate_open_house_last_synced', nowIso); } catch (e) { console.debug(e); }
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

    const targetListing = listings.find(l => l.id === listingId || l.sisu_listing_id === listingId);

    const agentEmail = currentUser?.email || currentAgentData?.profile?.email || 'agent@brianburds.com';
    const agentName = currentAgentData?.name || currentUser?.name || 'Syndicate Agent';
    const agentPhone = currentAgentData?.phone || currentAgentData?.profile?.phone || '(915) 555-0130';

    const newBooking = {
      id: `oh-book-${Date.now()}`,
      listing_id: listingId,
      listing_address: targetListing?.address || '',
      listing_price: targetListing?.price_formatted || '',
      listing_agent_name: targetListing?.listing_agent_name || '',
      seller_contact_id: targetListing?.seller_contact_id || null,
      seller_contact_name: targetListing?.seller_contact_name || '',
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

    // Update state and persist immediately to localStorage for cross-page/emulation persistence
    const updatedBookings = [newBooking, ...bookings];
    persistBookings(updatedBookings);

    // Persist to Supabase events table (cloud synced across all agents & admin)
    if (supabase) {
      try {
        const evtPayload = bookingToEvent(newBooking);
        const { error: evtErr } = await supabase.from('events').insert([evtPayload]);
        if (evtErr) {
          console.warn('Supabase events insert error:', evtErr.message);
        }
      } catch (dbErr) {
        console.warn('Error persisting booking event to DB:', dbErr);
      }
    }

    return newBooking;
  };

  // Approve a booking (creates FUB event, sends LinqApp text, updates status)
  const approveBooking = async (bookingId, reviewerName = 'Listing Coordinator') => {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) throw new Error('Booking not found');

    const listing = listings.find(l => l.id === booking.listing_id || l.sisu_listing_id === booking.listing_id);

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
      let updatedBookingObj = null;
      const updatedBookings = bookings.map(b => {
        if (b.id === bookingId) {
          updatedBookingObj = {
            ...b,
            status: 'approved',
            fub_event_id: fubEventId,
            reviewed_at: reviewedAt,
            reviewed_by: reviewerName
          };
          return updatedBookingObj;
        }
        return b;
      });

      persistBookings(updatedBookings);

      // Award XP to agent for hosting open house if available
      if (awardAgentXp && booking.agent_id) {
        try {
          await awardAgentXp(booking.agent_id, 50, 'Hosting Team Open House', {
            bookingId,
            listingAddress: listing?.address || booking.listing_address || 'Listing',
            date: booking.date
          });
        } catch (xpErr) {
          console.warn('Could not auto-award XP:', xpErr);
        }
      }

      // Persist status update to Supabase events table
      if (supabase && updatedBookingObj) {
        try {
          await supabase
            .from('events')
            .update(bookingToEvent(updatedBookingObj))
            .eq('id', bookingId);
        } catch (dbErr) {
          console.warn('Error updating approved booking in events table:', dbErr);
        }
      }

      return { success: true, fubEventId };
    } catch (err) {
      console.error('Error approving booking:', err);
      // Fallback local update
      const reviewedAt = new Date().toISOString();
      const updatedBookings = bookings.map(b => b.id === bookingId ? { ...b, status: 'approved', fub_event_id: `fub-${Date.now()}`, reviewed_at: reviewedAt, reviewed_by: reviewerName } : b);
      persistBookings(updatedBookings);
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
      let updatedBookingObj = null;
      const updatedBookings = bookings.map(b => {
        if (b.id === bookingId) {
          updatedBookingObj = {
            ...b,
            status: 'rejected',
            rejection_reason: reason,
            reviewed_at: reviewedAt,
            reviewed_by: reviewerName
          };
          return updatedBookingObj;
        }
        return b;
      });

      persistBookings(updatedBookings);

      if (supabase && updatedBookingObj) {
        try {
          await supabase
            .from('events')
            .update(bookingToEvent(updatedBookingObj))
            .eq('id', bookingId);
        } catch (dbErr) {
          console.warn('Error updating rejected booking in events table:', dbErr);
        }
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
    try { localStorage.setItem('syndicate_open_house_config', JSON.stringify(updated)); } catch (e) { console.debug(e); }

    if (supabase) {
      try {
        await supabase
          .from('open_house_settings')
          .upsert([{ id: 'default', ...updated }], { onConflict: 'id' });
      } catch (err) {
        console.debug('open_house_settings upsert error, falling back to snapshot:', err);
        await supabase
          .from('global_settings')
          .upsert([{ id: 'open_house_settings_snapshot', data: updated }]);
      }
    }
  };

  // Trigger weekly report notification prompt manually
  const sendWeeklyReportPrompt = async (targetPhone, targetName) => {
    try {
      const phoneToSend = targetPhone || weeklyReportConfig.coordinator_phone;
      const nameToSend = targetName || weeklyReportConfig.coordinator_name;

      const res = await fetch('/api/open-house/weekly-report-notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coordinatorPhone: phoneToSend,
          coordinatorName: nameToSend
        })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        const updated = { ...weeklyReportConfig, last_report_sent_at: data.sentAt || new Date().toISOString() };
        setWeeklyReportConfig(updated);
        try { localStorage.setItem('syndicate_open_house_config', JSON.stringify(updated)); } catch (e) { console.debug(e); }
        return { success: true, data };
      }
      return { 
        success: false, 
        error: data.linqError || data.error || data.message || `Server returned status ${res.status}`, 
        data 
      };
    } catch (err) {
      console.warn('Could not send notification prompt via API:', err);
      return { success: false, error: err.message };
    }
  };

  // Toggle whether a listing is available for open house
  const toggleListingOpenHouseAvailability = async (listingId, isEnabled) => {
    const updatedListings = listings.map(l => {
      if (l.id === listingId) {
        const nextVal = isEnabled !== undefined ? isEnabled : (l.is_open_house_enabled === false ? true : false);
        return {
          ...l,
          is_open_house_enabled: nextVal
        };
      }
      return l;
    });

    persistListings(updatedListings);

    // Persist to Supabase / snapshot if connected
    if (supabase) {
      try {
        const target = updatedListings.find(l => l.id === listingId);
        if (target) {
          await supabase.from('listings').upsert([target], { onConflict: 'id' });
        }
      } catch (err) {
        console.warn('Error saving listing availability to Supabase:', err);
      }
    }
  };

  // Filtered views
  const currentAgentEmail = (currentUser?.email || '').toLowerCase().trim();
  const currentAgentName = (currentUser?.name || currentAgentData?.name || '').toLowerCase().trim();
  const myBookings = useMemo(() => {
    return bookings.filter(b => {
      const bEmail = (b.agent_id || '').toLowerCase().trim();
      const bName = (b.agent_name || '').toLowerCase().trim();
      if (currentAgentEmail && bEmail === currentAgentEmail) return true;
      if (currentAgentName && (bName.includes(currentAgentName) || currentAgentName.includes(bName))) return true;
      return false;
    });
  }, [bookings, currentAgentEmail, currentAgentName]);

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
        toggleListingOpenHouseAvailability,
        loadOpenHouseData
      }}
    >
      {children}
    </OpenHouseContext.Provider>
  );
};
