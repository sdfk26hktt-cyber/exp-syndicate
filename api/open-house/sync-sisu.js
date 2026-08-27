import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const sisuApiKey = process.env.SISU_API_KEY;
const fubApiKey = process.env.FUB_API_KEY;

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

const HOME_PHOTOS = [
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1576941089067-2de3c901e126?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80'
];

/**
 * Fetch and parse all pages of Sierra Interactive featured listings from ephomesonline.com
 * Extracts MLS ID, main photo CDN URL, price, address, beds, baths, and sqft.
 */
async function fetchSierraFeaturedListings() {
  const sierraListings = [];
  let page = 1;
  const maxPages = 20;

  while (page <= maxPages) {
    const url = page === 1 
      ? 'https://www.ephomesonline.com/featured-listings/' 
      : `https://www.ephomesonline.com/featured-listings/?pg=${page}`;

    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      if (!res.ok) break;
      const html = await res.text();

      // Find all si-listing card blocks
      const cardRegex = /<div[^>]*class=["'][^"']*si-listing\b[^"']*["'][\s\S]*?(?=<div[^>]*class=["'][^"']*si-listing\b|<\/div>\s*<\/div>\s*<\/div>\s*<div class="si-pagination|$)/gi;
      const matches = html.match(cardRegex) || [];
      if (matches.length === 0) break;

      for (const cardHtml of matches) {
        // 1. MLS Number
        const mlsAttrMatch = cardHtml.match(/data-mls=["'](\d+)["']/i);
        const mlsInfoMatch = cardHtml.match(/<div[^>]*class=["']si-listing__info-value["'][^>]*>\s*<span>(\d+)<\/span>\s*<\/div>\s*<div[^>]*class=["']si-listing__info-label["'][^>]*>\s*MLS/i);
        const mls = mlsAttrMatch ? mlsAttrMatch[1] : (mlsInfoMatch ? mlsInfoMatch[1] : null);

        // 2. Address
        const streetMatch = cardHtml.match(/<div class="si-listing__title-main">([^<]+)<\/div>/i);
        const cityStateZipMatch = cardHtml.match(/<div class="si-listing__title-description">([^<]+)<\/div>/i);
        const street = streetMatch ? streetMatch[1].trim() : '';
        const cityStateZip = cityStateZipMatch ? cityStateZipMatch[1].trim() : '';
        const fullAddress = street && cityStateZip ? `${street}, ${cityStateZip}` : (street || cityStateZip);

        // 3. Price
        const priceAttrMatch = cardHtml.match(/data-price=["'](\d+)["']/i);
        const priceMainMatch = cardHtml.match(/<div class="si-listing__price-main">\s*([^<]+)\s*<\/div>/i);
        const priceNum = priceAttrMatch ? parseInt(priceAttrMatch[1], 10) : (priceMainMatch ? parseInt(priceMainMatch[1].replace(/[^0-9]/g, ''), 10) : 0);
        const priceFormatted = priceMainMatch ? priceMainMatch[1].trim() : (priceNum ? `$${priceNum.toLocaleString()}` : 'Contact Team');

        // 4. Photo CDN URL
        const photoMatch = cardHtml.match(/data-src=["'](https:\/\/cdn\.listingphotos\.sierrastatic\.com\/[^"']+)["']/i) ||
                           cardHtml.match(/src=["'](https:\/\/cdn\.listingphotos\.sierrastatic\.com\/[^"']+)["']/i);
        const photo = photoMatch ? photoMatch[1] : null;

        // 5. Bedrooms
        const bedsMatch = cardHtml.match(/<div class="si-listing__info-value">\s*<span>([^<]+)<\/span>\s*<\/div>\s*<div class="si-listing__info-label">\s*Beds/i);
        const bedrooms = bedsMatch ? parseFloat(bedsMatch[1].trim()) || 0 : 0;

        // 6. Bathrooms (handles full + half bath format e.g. 2<small>F</small>1<small>1/2</small> or plain number)
        const bathsBlockMatch = cardHtml.match(/<div class="si-listing__info-value">([\s\S]*?)<\/div>\s*<div class="si-listing__info-label">\s*Baths/i);
        let bathrooms = 0;
        if (bathsBlockMatch) {
          const rawBaths = bathsBlockMatch[1];
          const fullMatch = rawBaths.match(/(\d+)<small>F<\/small>/i);
          const halfMatch = rawBaths.match(/(\d+)<small>1\/2<\/small>/i) || rawBaths.match(/<small>1\/2<\/small>/i);
          const threeQtrMatch = rawBaths.match(/(\d+)<small>3\/4<\/small>/i);
          const plainMatch = rawBaths.match(/<span>(\d+(?:\.\d+)?)<\/span>/i);

          if (fullMatch) {
            bathrooms += parseInt(fullMatch[1], 10);
            if (halfMatch) bathrooms += 0.5;
            if (threeQtrMatch) bathrooms += 0.75;
          } else if (plainMatch) {
            bathrooms = parseFloat(plainMatch[1]);
          } else {
            const stripped = rawBaths.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
            bathrooms = parseFloat(stripped) || 0;
          }
        }

        // 7. Square Footage
        const sqftMatch = cardHtml.match(/<div class="si-listing__info-value">\s*<span>([^<]+)<\/span>\s*<\/div>\s*<div class="si-listing__info-label">\s*Sq\.Ft\./i);
        const sqft = sqftMatch ? parseInt(sqftMatch[1].replace(/[^0-9]/g, ''), 10) || 0 : 0;

        // 8. Agent Name
        const listedByMatch = cardHtml.match(/Listed by <strong>([^<]+)<\/strong>/i);
        const agentName = listedByMatch ? listedByMatch[1].trim() : 'Brian Burds';

        sierraListings.push({
          mls,
          street,
          cityStateZip,
          fullAddress,
          price: priceNum,
          priceFormatted,
          photo,
          bedrooms,
          bathrooms,
          sqft,
          agentName
        });
      }

      // Check if there is a next page
      const hasNextPage = html.includes(`?pg=${page + 1}`) || html.includes(`href="/featured-listings/?pg=${page + 1}"`);
      if (!hasNextPage) break;
      page++;
    } catch (e) {
      console.warn(`Error on Sierra page ${page}:`, e.message);
      break;
    }
  }

  return sierraListings;
}

/**
 * Match FUB deal against scraped Sierra Interactive listings
 */
function findSierraMatch(sierraListings, dealAddress, dealName) {
  const textToSearch = `${dealAddress} ${dealName}`.toLowerCase();
  const numMatch = textToSearch.match(/\b(\d{2,6})\b/);
  const streetNum = numMatch ? numMatch[1] : null;

  for (const s of sierraListings) {
    const sStreetLower = s.street.toLowerCase();
    const sNum = sStreetLower.match(/^\d+/)?.[0];
    
    if (streetNum && sNum === streetNum) {
      const sWords = sStreetLower.replace(/^\d+\s*/, '').split(/[\s,]+/).filter(w => w.length > 2);
      if (sWords.length === 0 || sWords.some(w => textToSearch.includes(w))) {
        return s;
      }
    }
  }
  return null;
}

export default async function handler(req, res) {
  // Allow GET and POST for sync
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    let syncedListings = [];
    let source = 'sisu_fub_sierra_live';

    // 0. Fetch all pages of Sierra Interactive featured listings
    const sierraListings = await fetchSierraFeaturedListings();
    const matchedMlsSet = new Set();

    // 1. Pull live Sisu listings via Follow Up Boss Sisu Sellers Pipeline
    if (fubApiKey) {
      try {
        const fubAuth = Buffer.from(`${fubApiKey}:`).toString('base64');
        let allDeals = [];
        let nextUrl = 'https://api.followupboss.com/v1/deals?limit=100';

        while (nextUrl && allDeals.length < 1000) {
          const fubRes = await fetch(nextUrl, {
            headers: {
              'Authorization': `Basic ${fubAuth}`,
              'Accept': 'application/json'
            }
          });
          if (!fubRes.ok) break;
          const data = await fubRes.json();
          const deals = data.deals || [];
          allDeals.push(...deals);
          nextUrl = data._metadata?.nextLink;
          if (!deals.length) break;
        }

        // Filter for Sisu Sellers in active / live stages
        const activeDeals = allDeals.filter(d => {
          if (d.pipelineName !== 'Sisu Sellers') return false;
          if (d.status !== 'Active') return false;
          const stage = (d.stageName || '').toLowerCase();
          return stage === 'mls live listings' || stage === 'signed' || stage === 'active' || stage.includes('live');
        });

        if (activeDeals.length > 0) {
          syncedListings = activeDeals.map((d, index) => {
            const address = d.customAddressLine1 || d.name || 'Listing';
            const city = d.customCity || 'El Paso';
            const state = d.customState || 'TX';
            const zip = d.customPostalCode || '';
            const fullAddress = `${address}, ${city}, ${state} ${zip}`.replace(/,\s*,/g, ',').trim();

            const priceNum = typeof d.price === 'number' ? d.price : (Number(String(d.price).replace(/[^0-9.-]+/g, '')) || 0);

            // Match deal with Sierra for MLS photo, real beds, baths, sqft, MLS #
            const sierraMatch = findSierraMatch(sierraListings, fullAddress, d.name);
            if (sierraMatch && sierraMatch.mls) {
              matchedMlsSet.add(sierraMatch.mls);
            }

            const bedrooms = sierraMatch && sierraMatch.bedrooms > 0 ? sierraMatch.bedrooms : 4;
            const bathrooms = sierraMatch && sierraMatch.bathrooms > 0 ? sierraMatch.bathrooms : 2.5;
            const sqft = sierraMatch && sierraMatch.sqft > 0 
              ? sierraMatch.sqft 
              : (priceNum > 400000 ? 3200 : (priceNum > 250000 ? 2400 : 1800));

            const coverImage = sierraMatch?.photo || HOME_PHOTOS[index % HOME_PHOTOS.length];
            const displayAddress = sierraMatch?.fullAddress || fullAddress;
            const priceFormatted = priceNum > 0 ? `$${priceNum.toLocaleString()}` : (sierraMatch?.priceFormatted || 'Contact Team');

            return {
              id: `fub-sisu-${d.id}`,
              sisu_listing_id: sierraMatch?.mls ? `MLS-${sierraMatch.mls}` : (d.customSisuTransactionId ? `SISU-${d.customSisuTransactionId}` : `FUB-${d.id}`),
              address: displayAddress,
              price: priceNum || sierraMatch?.price || 0,
              price_formatted: priceFormatted,
              stage: d.stageName,
              listing_agent_id: d.users?.[0]?.email || 'brian@brianburds.com',
              listing_agent_name: d.users?.[0]?.name || sierraMatch?.agentName || 'Brian Burds',
              seller_contact_name: d.people?.[0]?.name || 'Seller',
              seller_contact_id: d.people?.[0]?.id ? String(d.people[0].id) : null,
              seller_phone: '(915) 555-0100',
              status: 'active',
              is_available_for_open_house: true,
              bedrooms,
              bathrooms,
              sqft,
              cover_image: coverImage,
              notes: d.customLockboxSerialNumber ? `Lockbox Serial: ${d.customLockboxSerialNumber} | Stage: ${d.stageName}` : `Stage: ${d.stageName}`,
              last_synced_at: new Date().toISOString()
            };
          });
        }
      } catch (fubErr) {
        console.warn('Error fetching live Sisu deals from FUB:', fubErr.message);
      }
    }

    // 2. Direct Sisu API check if available and not yet populated
    if (syncedListings.length === 0 && sisuApiKey) {
      try {
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
          syncedListings = items.map((item, index) => {
            const priceNum = Number(item.list_price || item.price || item.volume || 0);
            const address = item.address || item.street_address || item.property_address || 'Address on file';
            const sierraMatch = findSierraMatch(sierraListings, address, item.client_name || '');
            if (sierraMatch && sierraMatch.mls) {
              matchedMlsSet.add(sierraMatch.mls);
            }

            const bedrooms = (sierraMatch && sierraMatch.bedrooms > 0) ? sierraMatch.bedrooms : (item.bedrooms || 3);
            const bathrooms = (sierraMatch && sierraMatch.bathrooms > 0) ? sierraMatch.bathrooms : (item.bathrooms || 2);
            const sqft = (sierraMatch && sierraMatch.sqft > 0) ? sierraMatch.sqft : (item.sqft || item.square_feet || 2000);
            const coverImage = sierraMatch?.photo || item.photo_url || item.image_url || HOME_PHOTOS[index % HOME_PHOTOS.length];

            return {
              id: `sisu-${item.id || item.transaction_id}`,
              sisu_listing_id: sierraMatch?.mls ? `MLS-${sierraMatch.mls}` : String(item.id || item.listing_number || item.transaction_id),
              address: sierraMatch?.fullAddress || address,
              price: priceNum,
              price_formatted: priceNum > 0 ? `$${priceNum.toLocaleString()}` : '$0',
              listing_agent_id: item.agent_email || item.listing_agent_email || item.agent_id || 'admin@brianburds.com',
              listing_agent_name: item.agent_name || item.listing_agent_name || 'Syndicate Listing Agent',
              seller_contact_name: item.client_name || item.seller_name || 'Seller on file',
              seller_contact_id: item.fub_contact_id || item.seller_contact_id || null,
              seller_phone: item.client_phone || item.seller_phone || '',
              status: (item.status || 'active').toLowerCase() === 'active' ? 'active' : 'pending',
              is_available_for_open_house: true,
              bedrooms,
              bathrooms,
              sqft,
              cover_image: coverImage,
              notes: item.notes || item.remarks || '',
              last_synced_at: new Date().toISOString()
            };
          });
          source = 'sisu_direct_api';
        }
      } catch (err) {
        console.warn('Direct Sisu API error:', err.message);
      }
    }

    // 3. Add remaining Sierra featured listings from ephomesonline.com that weren't in Sisu deals
    let addedSierraCount = 0;
    for (const s of sierraListings) {
      if (s.mls && matchedMlsSet.has(s.mls)) continue;

      addedSierraCount++;
      syncedListings.push({
        id: `sierra-${s.mls || s.street.replace(/\s+/g, '-').toLowerCase()}`,
        sisu_listing_id: s.mls ? `MLS-${s.mls}` : `SIERRA-${addedSierraCount}`,
        address: s.fullAddress,
        price: s.price,
        price_formatted: s.priceFormatted,
        stage: 'MLS Live Listings',
        listing_agent_id: 'brian@brianburds.com',
        listing_agent_name: s.agentName || 'Brian Burds',
        seller_contact_name: 'Listing Client',
        seller_contact_id: null,
        seller_phone: '(915) 555-0100',
        status: 'active',
        is_available_for_open_house: true,
        bedrooms: s.bedrooms || 3,
        bathrooms: s.bathrooms || 2,
        sqft: s.sqft || 1800,
        cover_image: s.photo || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80',
        notes: `MLS Live Listing #${s.mls || 'N/A'} from ephomesonline.com`,
        last_synced_at: new Date().toISOString()
      });
    }

    // Upsert into Supabase if connected
    if (supabase && syncedListings.length > 0) {
      try {
        await supabase.from('listings').upsert(syncedListings, { onConflict: 'id' });
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
