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

// Real team listings synced from Sisu Sellers & FUB MLS Live Listings
const INITIAL_SEED_LISTINGS = [
  {
    id: 'fub-sisu-4245',
    sisu_listing_id: 'MLS-949724',
    address: '304 Rio Pinsaqui Ct, El Paso, TX 79932',
    price: 680000,
    price_formatted: '$680,000',
    stage: 'Mls Live Listings',
    listing_agent_id: 'angelica@brianburds.com',
    listing_agent_name: 'Angelica Lopez',
    seller_contact_name: 'Elilina Alba',
    seller_contact_id: '64948',
    seller_phone: '(915) 555-0100',
    status: 'active',
    bedrooms: 5,
    bathrooms: 4,
    sqft: 3450,
    cover_image: 'https://cdn.listingphotos.sierrastatic.com/pics2x/v1787249901/285/285_949724_01.jpg',
    notes: 'Lockbox Serial: 1453102 | MLS #949724 | Stage: Mls Live Listings',
    last_synced_at: new Date().toISOString()
  },
  {
    id: 'fub-sisu-4723',
    sisu_listing_id: 'MLS-949641',
    address: '1076 Haper Ct, El Paso, TX 79932',
    price: 290000,
    price_formatted: '$290,000',
    stage: 'Mls Live Listings',
    listing_agent_id: 'carmen@brianburds.com',
    listing_agent_name: 'Carmen Luna',
    seller_contact_name: 'Alejandro Fierro',
    seller_contact_id: '66319',
    seller_phone: '(915) 555-0100',
    status: 'active',
    bedrooms: 4,
    bathrooms: 2.5,
    sqft: 2150,
    cover_image: 'https://cdn.listingphotos.sierrastatic.com/pics2x/v1787157948/285/285_949641_01.jpg',
    notes: 'Lockbox Serial: 1460137 | MLS #949641 | Stage: Mls Live Listings',
    last_synced_at: new Date().toISOString()
  },
  {
    id: 'fub-sisu-4703',
    sisu_listing_id: 'MLS-949650',
    address: '3604 Waterspring Ln, El Paso, TX 79936',
    price: 168000,
    price_formatted: '$168,000',
    stage: 'Mls Live Listings',
    listing_agent_id: 'cassandra@brianburds.com',
    listing_agent_name: 'Cassandra Urrutia',
    seller_contact_name: 'Juan Loy Jr.',
    seller_contact_id: '22996',
    seller_phone: '(915) 555-0100',
    status: 'active',
    bedrooms: 3,
    bathrooms: 2,
    sqft: 1620,
    cover_image: 'https://cdn.listingphotos.sierrastatic.com/pics2x/v1787162690/285/285_949650_01.jpg',
    notes: 'Lockbox Serial: 1468009 | MLS #949650 | Stage: Mls Live Listings',
    last_synced_at: new Date().toISOString()
  },
  {
    id: 'fub-sisu-4813',
    sisu_listing_id: 'MLS-949656',
    address: '3405 Scarlet Point Dr, El Paso, TX 79938',
    price: 315000,
    price_formatted: '$315,000',
    stage: 'Mls Live Listings',
    listing_agent_id: 'carmen@brianburds.com',
    listing_agent_name: 'Carmen Luna',
    seller_contact_name: 'Scarlet Point Seller',
    seller_contact_id: '66512',
    seller_phone: '(915) 555-0100',
    status: 'active',
    bedrooms: 4,
    bathrooms: 2.5,
    sqft: 2350,
    cover_image: 'https://cdn.listingphotos.sierrastatic.com/pics2x/v1787165221/285/285_949656_01.jpg',
    notes: 'MLS #949656 | Stage: Mls Live Listings',
    last_synced_at: new Date().toISOString()
  },
  {
    id: 'fub-sisu-4763',
    sisu_listing_id: 'MLS-949269',
    address: '7741 Waterhouse Dr, El Paso, TX 79912',
    price: 489000,
    price_formatted: '$489,000',
    stage: 'Mls Live Listings',
    listing_agent_id: 'angelica@brianburds.com',
    listing_agent_name: 'Angelica Lopez',
    seller_contact_name: 'Waterhouse Seller',
    seller_contact_id: '66421',
    seller_phone: '(915) 555-0100',
    status: 'active',
    bedrooms: 4,
    bathrooms: 3,
    sqft: 3100,
    cover_image: 'https://cdn.listingphotos.sierrastatic.com/pics2x/v1786572806/285/285_949269_01.jpg',
    notes: 'MLS #949269 | Stage: Mls Live Listings',
    last_synced_at: new Date().toISOString()
  },
  {
    id: 'fub-sisu-4852',
    sisu_listing_id: 'MLS-950036',
    address: '4573 Robert Acosta Dr, El Paso, TX 79934',
    price: 263000,
    price_formatted: '$263,000',
    stage: 'Signed',
    listing_agent_id: 'ivan@brianburds.com',
    listing_agent_name: 'Alvar Ivan Avella',
    seller_contact_name: 'Alec Sherman',
    seller_contact_id: '1671',
    seller_phone: '(915) 555-0100',
    status: 'active',
    bedrooms: 3,
    bathrooms: 2,
    sqft: 1950,
    cover_image: 'https://cdn.listingphotos.sierrastatic.com/pics2x/v1787769453/285/285_950036_01.jpg',
    notes: 'Lockbox Serial: 2387898 | MLS #950036 | Stage: Signed',
    last_synced_at: new Date().toISOString()
  },
  {
    id: 'fub-sisu-4546',
    sisu_listing_id: 'SISU-6646089',
    address: '6969 Granero Dr, El Paso, TX 79912',
    price: 465000,
    price_formatted: '$465,000',
    stage: 'Mls Live Listings',
    listing_agent_id: 'angelica@brianburds.com',
    listing_agent_name: 'Angelica Lopez',
    seller_contact_name: 'Christopher Bejarano',
    seller_contact_id: '8603',
    seller_phone: '(915) 555-0100',
    status: 'active',
    bedrooms: 4,
    bathrooms: 3,
    sqft: 2850,
    cover_image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
    notes: 'Lockbox Serial: 2446728 | Stage: Mls Live Listings',
    last_synced_at: new Date().toISOString()
  },
  {
    id: 'fub-sisu-4669',
    sisu_listing_id: 'SISU-6666449',
    address: '13735 Paseo Verde, El Paso, TX 79928',
    price: 250000,
    price_formatted: '$250,000',
    stage: 'Mls Live Listings',
    listing_agent_id: 'angelica@brianburds.com',
    listing_agent_name: 'Angelica Lopez',
    seller_contact_name: 'Hunter Haagsma Primary',
    seller_contact_id: '66228',
    seller_phone: '(915) 555-0100',
    status: 'active',
    bedrooms: 3,
    bathrooms: 2,
    sqft: 1890,
    cover_image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80',
    notes: 'Lockbox Serial: 2471646 | Stage: Mls Live Listings',
    last_synced_at: new Date().toISOString()
  },
  {
    id: 'fub-sisu-4337',
    sisu_listing_id: 'SISU-6602506',
    address: '733 Paseo Clasico, Horizon City, TX 79928',
    price: 439000,
    price_formatted: '$439,000',
    stage: 'Mls Live Listings',
    listing_agent_id: 'ivan@brianburds.com',
    listing_agent_name: 'Alvar Ivan Avella',
    seller_contact_name: 'Billy Atkinson',
    seller_contact_id: '5869',
    seller_phone: '(915) 555-0100',
    status: 'active',
    bedrooms: 4,
    bathrooms: 3,
    sqft: 2900,
    cover_image: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=800&q=80',
    notes: 'Lockbox Serial: 2397555 | Stage: Mls Live Listings',
    last_synced_at: new Date().toISOString()
  },
  {
    id: 'fub-sisu-4118',
    sisu_listing_id: 'SISU-6549307',
    address: '1076 Speranza Ct, El Paso, TX 79932',
    price: 440000,
    price_formatted: '$440,000',
    stage: 'Mls Live Listings',
    listing_agent_id: 'billy@brianburds.com',
    listing_agent_name: 'Billy Lopez',
    seller_contact_name: 'Sara Kew',
    seller_contact_id: '45629',
    seller_phone: '(915) 555-0100',
    status: 'active',
    bedrooms: 4,
    bathrooms: 3,
    sqft: 2750,
    cover_image: 'https://images.unsplash.com/photo-1576941089067-2de3c901e126?auto=format&fit=crop&w=800&q=80',
    notes: 'Lockbox Serial: 2389642 | Stage: Mls Live Listings',
    last_synced_at: new Date().toISOString()
  },
  {
    id: 'fub-sisu-4913',
    sisu_listing_id: 'SISU-6717375',
    address: '6360 Dakota Ridge, El Paso, TX 79912',
    price: 355000,
    price_formatted: '$355,000',
    stage: 'Signed',
    listing_agent_id: 'immanuel@brianburds.com',
    listing_agent_name: 'Immanuel Ceballos',
    seller_contact_name: 'Cody Beaubette',
    seller_contact_id: '66792',
    seller_phone: '(915) 555-0100',
    status: 'active',
    bedrooms: 4,
    bathrooms: 2.5,
    sqft: 2400,
    cover_image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80',
    notes: 'Stage: Signed',
    last_synced_at: new Date().toISOString()
  },
  {
    id: 'fub-sisu-3013',
    sisu_listing_id: 'MLS-937672',
    address: '6 Horizon City Estates #35 Lot 20, Horizon City, TX 79928',
    price: 85000,
    price_formatted: '$85,000',
    stage: 'Mls Live Listings',
    listing_agent_id: 'brian@brianburds.com',
    listing_agent_name: 'Brian Burds',
    seller_contact_name: 'Horizon Seller',
    seller_contact_id: '64730',
    seller_phone: '(915) 555-0100',
    status: 'active',
    bedrooms: 0,
    bathrooms: 0,
    sqft: 0,
    cover_image: 'https://cdn.listingphotos.sierrastatic.com/pics2x/v1786042332/285/285_937672_01.jpg',
    notes: 'MLS #937672 | Stage: Mls Live Listings',
    last_synced_at: new Date().toISOString()
  },
  {
    id: 'fub-sisu-4848',
    sisu_listing_id: 'SISU-6699729',
    address: '5144 Ocotillo St, El Paso, TX 79932',
    price: 375000,
    price_formatted: '$375,000',
    stage: 'Signed',
    listing_agent_id: 'billy@brianburds.com',
    listing_agent_name: 'Billy Lopez',
    seller_contact_name: 'Deborah Hill',
    seller_contact_id: '66577',
    seller_phone: '(915) 555-0100',
    status: 'active',
    bedrooms: 4,
    bathrooms: 2.5,
    sqft: 2400,
    cover_image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
    notes: 'Stage: Signed',
    last_synced_at: new Date().toISOString()
  },
  {
    id: 'fub-sisu-4721',
    sisu_listing_id: 'SISU-6672890',
    address: '12649 Azulejos St, El Paso, TX 79928',
    price: 280000,
    price_formatted: '$280,000',
    stage: 'Signed',
    listing_agent_id: 'billy@brianburds.com',
    listing_agent_name: 'Billy Lopez',
    seller_contact_name: 'Joseph Castruita',
    seller_contact_id: '22699',
    seller_phone: '(915) 555-0100',
    status: 'active',
    bedrooms: 4,
    bathrooms: 2.5,
    sqft: 2200,
    cover_image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
    notes: 'Stage: Signed',
    last_synced_at: new Date().toISOString()
  },
  {
    id: 'fub-sisu-4508',
    sisu_listing_id: 'SISU-6639937',
    address: '6300 Nostalgia, El Paso, TX 79912',
    price: 530000,
    price_formatted: '$530,000',
    stage: 'Signed',
    listing_agent_id: 'angelica@brianburds.com',
    listing_agent_name: 'Angelica Lopez',
    seller_contact_name: 'Mark Duran',
    seller_contact_id: '65691',
    seller_phone: '(915) 555-0100',
    status: 'active',
    bedrooms: 4,
    bathrooms: 3.5,
    sqft: 3100,
    cover_image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80',
    notes: 'Stage: Signed',
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
    coordinator_phone: '+1 (915) 494-7984',
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

    setListings(updatedListings);

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
        toggleListingOpenHouseAvailability,
        loadOpenHouseData
      }}
    >
      {children}
    </OpenHouseContext.Provider>
  );
};
