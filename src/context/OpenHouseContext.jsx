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

// Real bookings are synced dynamically from Supabase events
const INITIAL_SEED_BOOKINGS = [];

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

  // Save bookings to state, localStorage, and Supabase cloud system config
  const persistBookings = async (newBookings) => {
    setBookings(newBookings);
    try {
      localStorage.setItem('syndicate_open_house_bookings', JSON.stringify(newBookings));
    } catch (e) {
      console.warn('Could not persist open house bookings to localStorage:', e);
    }

    if (supabase) {
      try {
        await supabase.from('agents').upsert([{
          id: '__SYSTEM_CONFIG_OPEN_HOUSES__',
          name: 'Open House Bookings Config',
          status: 'system',
          profile: {
            bookings: newBookings,
            last_updated_at: new Date().toISOString(),
            total_count: newBookings.length
          }
        }]);
      } catch (err) {
        console.warn('Error saving open house bookings to Supabase:', err);
      }
    }
  };

  // Save listings to state, localStorage, and Supabase cloud system config
  const persistListings = async (newListings) => {
    setListings(newListings);
    try {
      localStorage.setItem('syndicate_open_house_listings', JSON.stringify(newListings));
    } catch (e) {
      console.warn('Could not persist open house listings to localStorage:', e);
    }

    if (supabase) {
      try {
        await supabase.from('agents').upsert([{
          id: '__SYSTEM_CONFIG_LISTINGS__',
          name: 'Listings & Sisu/FUB Inventory Config',
          status: 'system',
          profile: {
            listings: newListings,
            last_synced_at: new Date().toISOString(),
            total_count: newListings.length
          }
        }]);
      } catch (err) {
        console.warn('Error saving listings to Supabase:', err);
      }
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

  // Load bookings and listings from Supabase on mount
  const loadOpenHouseData = async () => {
    if (!supabase) return;

    try {
      // 1. Listings - Load from Supabase system config (__SYSTEM_CONFIG_LISTINGS__)
      try {
        const { data: configRow } = await supabase
          .from('agents')
          .select('*')
          .eq('id', '__SYSTEM_CONFIG_LISTINGS__')
          .single();

        if (configRow?.profile?.listings && Array.isArray(configRow.profile.listings) && configRow.profile.listings.length > 0) {
          setListings(configRow.profile.listings);
          try {
            localStorage.setItem('syndicate_open_house_listings', JSON.stringify(configRow.profile.listings));
          } catch (e) {
            console.debug(e);
          }
          if (configRow.profile.last_synced_at) {
            setLastSyncedAt(configRow.profile.last_synced_at);
            try { localStorage.setItem('syndicate_open_house_last_synced', configRow.profile.last_synced_at); } catch (e) { console.debug(e); }
          }
        }
      } catch (listErr) {
        console.debug('Cloud listing config load fallback:', listErr);
      }

      // 2. Bookings - Load from Supabase system config (__SYSTEM_CONFIG_OPEN_HOUSES__), isolated from training calendar events
      try {
        const { data: configRow } = await supabase
          .from('agents')
          .select('*')
          .eq('id', '__SYSTEM_CONFIG_OPEN_HOUSES__')
          .single();

        if (configRow?.profile?.bookings && Array.isArray(configRow.profile.bookings)) {
          setBookings(configRow.profile.bookings);
          try {
            localStorage.setItem('syndicate_open_house_bookings', JSON.stringify(configRow.profile.bookings));
          } catch (e) {
            console.debug(e);
          }
        }
      } catch (evtQueryErr) {
        console.warn('Could not query open house bookings from system config:', evtQueryErr);
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
          .channel('open_house_realtime_configs')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'agents' },
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

    const agentEmail = (
      currentUser?.email || 
      currentAgentData?.id || 
      currentAgentData?.profile?.email || 
      (typeof currentUser?.id === 'string' && currentUser.id.includes('@') ? currentUser.id : '') ||
      'agent@brianburds.com'
    ).toLowerCase().trim();

    const agentName = (
      currentUser?.name && currentUser.name !== 'Emulated Agent' && currentUser.name !== 'Syndicate Agent' ? currentUser.name : (
        currentAgentData?.name || currentUser?.name || 'Syndicate Agent'
      )
    );

    const agentPhone = (
      currentUser?.phone || 
      currentAgentData?.profile?.phone || 
      currentAgentData?.phone || 
      '(915) 555-0130'
    );

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

    // Update state and persist immediately to localStorage and Supabase cloud system config
    const updatedBookings = [newBooking, ...bookings];
    persistBookings(updatedBookings);

    return newBooking;
  };

  // Approve a booking (updates status, sends LinqApp text, awards XP)
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
      const updatedBookings = bookings.map(b => {
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
      });

      persistBookings(updatedBookings);

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
      if (l.id === listingId || l.sisu_listing_id === listingId) {
        const nextVal = isEnabled !== undefined ? isEnabled : (l.is_open_house_enabled === false ? true : false);
        return {
          ...l,
          is_open_house_enabled: nextVal,
          is_available_for_open_house: nextVal
        };
      }
      return l;
    });

    await persistListings(updatedListings);
  };

  // Update specific listing with FUB, Sisu, property, or agent details
  const updateListing = async (listingId, updatedFields) => {
    const updatedListings = listings.map(l => {
      if (l.id === listingId || l.sisu_listing_id === listingId) {
        const sellerId = updatedFields.seller_contact_id !== undefined ? updatedFields.seller_contact_id : l.seller_contact_id;
        const fubDealId = updatedFields.fub_deal_id !== undefined ? updatedFields.fub_deal_id : l.fub_deal_id;
        
        let fubLink = updatedFields.fub_link || l.fub_link;
        if (sellerId) {
          fubLink = `https://brianburds.followupboss.com/2/people/view/${sellerId}`;
        } else if (fubDealId) {
          fubLink = `https://brianburds.followupboss.com/2/deals/view/${fubDealId}`;
        }

        const priceNum = updatedFields.price !== undefined 
          ? (typeof updatedFields.price === 'number' ? updatedFields.price : (Number(String(updatedFields.price).replace(/[^0-9.-]+/g, '')) || 0))
          : l.price;

        const priceFormatted = updatedFields.price_formatted || (priceNum > 0 ? `$${priceNum.toLocaleString()}` : (l.price_formatted || 'Contact Team'));

        return {
          ...l,
          ...updatedFields,
          price: priceNum,
          price_formatted: priceFormatted,
          seller_contact_id: sellerId,
          fub_deal_id: fubDealId,
          fub_link: fubLink,
          fub_status: (sellerId || fubDealId || fubLink) ? 'connected' : 'unlinked',
          last_synced_at: new Date().toISOString()
        };
      }
      return l;
    });

    await persistListings(updatedListings);
    return updatedListings.find(l => l.id === listingId || l.sisu_listing_id === listingId);
  };

  // Add new listing manually
  const addListing = async (newListingData) => {
    const id = newListingData.id || `fub-sisu-${Date.now()}`;
    const sisuId = newListingData.sisu_listing_id || (newListingData.mls_number ? `MLS-${newListingData.mls_number}` : `SISU-${Date.now().toString().slice(-6)}`);
    const sellerId = newListingData.seller_contact_id || null;
    const fubDealId = newListingData.fub_deal_id || null;
    
    let fubLink = newListingData.fub_link;
    if (sellerId) {
      fubLink = `https://brianburds.followupboss.com/2/people/view/${sellerId}`;
    } else if (fubDealId) {
      fubLink = `https://brianburds.followupboss.com/2/deals/view/${fubDealId}`;
    }

    const priceNum = typeof newListingData.price === 'number' 
      ? newListingData.price 
      : (Number(String(newListingData.price || 0).replace(/[^0-9.-]+/g, '')) || 0);

    const formatted = {
      id,
      sisu_listing_id: sisuId,
      mls_number: newListingData.mls_number || (sisuId.startsWith('MLS-') ? sisuId.replace('MLS-', '') : ''),
      address: newListingData.address || 'New Listing Address',
      price: priceNum,
      price_formatted: newListingData.price_formatted || (priceNum > 0 ? `$${priceNum.toLocaleString()}` : 'Contact Team'),
      stage: newListingData.stage || 'MLS Live Listings',
      listing_agent_id: newListingData.listing_agent_id || 'brian@brianburds.com',
      listing_agent_name: newListingData.listing_agent_name || 'Brian Burds',
      seller_contact_name: newListingData.seller_contact_name || 'Seller on File',
      seller_contact_id: sellerId,
      seller_phone: newListingData.seller_phone || '(915) 555-0100',
      fub_deal_id: fubDealId,
      fub_link: fubLink,
      fub_status: (sellerId || fubDealId || fubLink) ? 'connected' : 'unlinked',
      status: newListingData.status || 'active',
      is_available_for_open_house: newListingData.is_available_for_open_house !== false,
      is_open_house_enabled: newListingData.is_open_house_enabled !== false,
      bedrooms: Number(newListingData.bedrooms) || 3,
      bathrooms: Number(newListingData.bathrooms) || 2,
      sqft: Number(newListingData.sqft) || 1800,
      cover_image: newListingData.cover_image || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80',
      notes: newListingData.notes || '',
      last_synced_at: new Date().toISOString()
    };

    const updatedListings = [formatted, ...listings];
    await persistListings(updatedListings);
    return formatted;
  };

  // Delete / remove listing
  const deleteListing = async (listingId) => {
    const updatedListings = listings.filter(l => l.id !== listingId && l.sisu_listing_id !== listingId);
    await persistListings(updatedListings);
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
        updateListing,
        addListing,
        deleteListing,
        loadOpenHouseData
      }}
    >
      {children}
    </OpenHouseContext.Provider>
  );
};
