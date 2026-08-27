import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const sisuApiKey = process.env.SISU_API_KEY;

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// Fallback seed listings if Sisu API key is not yet configured or in sandbox
const DEFAULT_DEMO_LISTINGS = [
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

export default async function handler(req, res) {
  // Allow GET and POST for sync
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    let syncedListings = [];
    let source = 'sisu_api';

    if (sisuApiKey) {
      try {
        // Call Sisu Beta API for active transactions / listings
        const sisuRes = await fetch('https://beta.sisu.co/api/v1/transactions?status=active&type=listing', {
          headers: {
            'Authorization': `Bearer ${sisuApiKey}`,
            'X-Api-Key': sisuApiKey,
            'Content-Type': 'application/json'
          }
        });

        if (sisuRes.ok) {
          const sisuData = await sisuRes.json();
          const items = Array.isArray(sisuData) ? sisuData : (sisuData.data || sisuData.transactions || []);
          
          syncedListings = items.map(item => {
            const priceNum = Number(item.list_price || item.price || item.volume || 0);
            return {
              id: `sisu-${item.id || item.transaction_id}`,
              sisu_listing_id: String(item.id || item.listing_number || item.transaction_id),
              address: item.address || item.street_address || item.property_address || 'Address on file',
              price: priceNum,
              price_formatted: priceNum > 0 ? `$${priceNum.toLocaleString()}` : '$0',
              listing_agent_id: item.agent_email || item.listing_agent_email || item.agent_id || 'admin@brianburds.com',
              listing_agent_name: item.agent_name || item.listing_agent_name || 'Syndicate Listing Agent',
              seller_contact_name: item.client_name || item.seller_name || 'Seller on file',
              seller_contact_id: item.fub_contact_id || item.seller_contact_id || null,
              seller_phone: item.client_phone || item.seller_phone || '',
              status: (item.status || 'active').toLowerCase() === 'active' ? 'active' : 'pending',
              bedrooms: item.bedrooms || 3,
              bathrooms: item.bathrooms || 2,
              sqft: item.sqft || item.square_feet || 2000,
              cover_image: item.photo_url || item.image_url || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80',
              notes: item.notes || item.remarks || '',
              last_synced_at: new Date().toISOString()
            };
          });
        } else {
          console.warn(`Sisu API returned status ${sisuRes.status}, falling back to seeded inventory.`);
          syncedListings = DEFAULT_DEMO_LISTINGS;
          source = 'sisu_demo_fallback';
        }
      } catch (apiErr) {
        console.warn('Error connecting to Sisu API, using fallback inventory:', apiErr.message);
        syncedListings = DEFAULT_DEMO_LISTINGS;
        source = 'sisu_demo_fallback';
      }
    } else {
      syncedListings = DEFAULT_DEMO_LISTINGS;
      source = 'sisu_demo_sandbox';
    }

    // Upsert into Supabase if connected
    if (supabase) {
      try {
        const { error: upsertError } = await supabase
          .from('listings')
          .upsert(syncedListings, { onConflict: 'id' });

        if (upsertError) {
          console.warn('Supabase upsert into listings returned error (table might need creation):', upsertError.message);
          // Also save snapshot in global_settings for fallback resilience
          await supabase.from('global_settings').upsert([
            { id: 'synced_listings_snapshot', data: syncedListings }
          ]);
        }
      } catch (dbErr) {
        console.warn('Database save warning:', dbErr.message);
      }
    }

    return res.status(200).json({
      success: true,
      source,
      count: syncedListings.length,
      syncedAt: new Date().toISOString(),
      listings: syncedListings
    });
  } catch (err) {
    console.error('Failed to sync Sisu listings:', err);
    return res.status(500).json({ error: 'Internal Server Error during Sisu listing sync', message: err.message });
  }
}
