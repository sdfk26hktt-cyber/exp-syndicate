import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const sisuApiKey = process.env.SISU_API_KEY;
const fubApiKey = process.env.FUB_API_KEY || 'fka_0GE0sHDxHWDK9pfJSqkQw2Y23Fme0R2mUS';

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

/**
 * Standardize address string for matching across FUB and Sierra
 */
function normalizeAddress(addr) {
  return String(addr || '')
    .toLowerCase()
    .replace(/[,\.]/g, ' ')
    .replace(/\b(street|st\b)/g, 'st')
    .replace(/\b(drive|dr\b)/g, 'dr')
    .replace(/\b(avenue|ave\b)/g, 'ave')
    .replace(/\b(lane|ln\b)/g, 'ln')
    .replace(/\b(court|ct\b)/g, 'ct')
    .replace(/\b(place|pl\b)/g, 'pl')
    .replace(/\b(road|rd\b)/g, 'rd')
    .replace(/\b(boulevard|blvd\b)/g, 'blvd')
    .replace(/\b(circle|cir\b)/g, 'cir')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Fetch and parse all pages of Sierra Interactive featured listings from ephomesonline.com
 * Extracts MLS ID, main photo CDN URL, price, address, beds, baths, and sqft.
 */
async function fetchSierraFeaturedListings(debugObj = {}) {
  const sierraListings = [];
  let page = 1;
  const maxPages = 10;

  while (page <= maxPages) {
    const url = page === 1 
      ? 'https://www.ephomesonline.com/featured-listings/' 
      : `https://www.ephomesonline.com/featured-listings/?pg=${page}`;

    let html = null;
    let lastStatus = 0;
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const res = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9'
          }
        });
        lastStatus = res.status;
        if (res.ok) {
          html = await res.text();
          break;
        }
      } catch (_fetchErr) {
        // Retry
      }
      if (attempt < 2) await new Promise(r => setTimeout(r, 400));
    }

    if (page === 1) {
      debugObj.sierraPage1Status = lastStatus;
      debugObj.sierraPage1HtmlLength = html ? html.length : 0;
    }

    if (!html) break;

    try {
      // Find all si-listing card blocks
      const cardRegex = /<div[^>]*class=["'][^"']*si-listing\b[^"']*["'][\s\S]*?(?=<div[^>]*class=["'][^"']*si-listing\b|<\/div>\s*<\/div>\s*<\/div>\s*<div class="si-pagination|$)/gi;
      const matches = html.match(cardRegex) || [];
      if (matches.length === 0) break;

      for (const cardHtml of matches) {
        if (cardHtml.includes('ph-item') || cardHtml.includes('ph-picture')) continue;

        // 1. MLS Number
        const mlsAttrMatch = cardHtml.match(/data-mls=["'](\d+)["']/i);
        const mlsInfoMatch = cardHtml.match(/<div[^>]*class=["']si-listing__info-value["'][^>]*>\s*<span>(\d+)<\/span>\s*<\/div>\s*<div[^>]*class=["']si-listing__info-label["'][^>]*>\s*MLS/i);
        const mlsUrlMatch = cardHtml.match(/\/property-search\/detail\/\d+\/(\d+)\//i);
        const mls = mlsAttrMatch ? mlsAttrMatch[1] : (mlsInfoMatch ? mlsInfoMatch[1] : (mlsUrlMatch ? mlsUrlMatch[1] : null));

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

        // 4. Photo CDN URL & High-Res Handling (Sierra Interactive)
        const rawPhotoMatch = cardHtml.match(/data-src=["'](https:\/\/cdn\.listingphotos\.sierrastatic\.com\/[^"']+)["']/i) ||
                              cardHtml.match(/src=["'](https:\/\/cdn\.listingphotos\.sierrastatic\.com\/[^"']+)["']/i) ||
                              cardHtml.match(/data-image=["'](https:\/\/cdn\.listingphotos\.sierrastatic\.com\/[^"']+)["']/i);
        let photo = rawPhotoMatch ? rawPhotoMatch[1] : null;
        if (photo && photo.includes('loadingphoto')) {
          photo = null;
        }
        if (photo) {
          photo = photo.replace(/\/pics1x\//i, '/pics2x/');
        }

        // 4b. Detail URL on ephomesonline.com
        const urlMatch = cardHtml.match(/data-url=["']([^"']+)["']/i) ||
                         cardHtml.match(/href=["'](\/property-search\/detail\/[^"']+)["']/i);
        const detailUrl = urlMatch ? (urlMatch[1].startsWith('http') ? urlMatch[1] : `https://www.ephomesonline.com${urlMatch[1]}`) : null;

        // 5. Bedrooms
        const bedsMatch = cardHtml.match(/<div class="si-listing__info-value">\s*<span>([^<]+)<\/span>\s*<\/div>\s*<div class="si-listing__info-label">\s*Beds/i);
        const bedrooms = bedsMatch ? parseFloat(bedsMatch[1].trim()) || 0 : 0;

        // 6. Bathrooms
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
          detailUrl,
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

  debugObj.sierraCount = sierraListings.length;
  return sierraListings;
}

/**
 * Match FUB deal against scraped Sierra Interactive listings
 */
function findSierraMatch(sierraListings, dealAddress, dealName) {
  const rawTarget = `${dealAddress} ${dealName}`;
  const normTarget = normalizeAddress(rawTarget);
  const numMatch = normTarget.match(/\b(\d{2,6})\b/);
  const streetNum = numMatch ? numMatch[1] : null;

  if (!streetNum) return null;

  for (const s of sierraListings) {
    const normSierra = normalizeAddress(s.street);
    const sNum = normSierra.match(/^\d+/)?.[0];
    
    if (sNum === streetNum) {
      const sWords = normSierra.replace(/^\d+\s*/, '').split(/[\s,]+/).filter(w => w.length > 2);
      if (sWords.length === 0 || sWords.some(w => normTarget.includes(w))) {
        return s;
      }
    }
  }
  return null;
}

/**
 * Targeted search on Sierra Interactive (ephomesonline.com) if not in featured list
 */
async function searchSierraByAddress(addressStr) {
  try {
    const norm = normalizeAddress(addressStr);
    const numMatch = norm.match(/\b(\d{2,6})\b/);
    if (!numMatch) return null;
    const streetNum = numMatch[1];
    const streetPart = norm.replace(/^\d+\s*/, '').split(/\s+/).slice(0, 2).join(' ');
    if (!streetPart) return null;

    const url = `https://www.ephomesonline.com/property-search/results/?search_type=address&street_number=${streetNum}&street_name=${encodeURIComponent(streetPart)}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    });
    if (!res.ok) return null;
    const html = await res.text();

    const mlsAttr = html.match(/data-mls=["'](\d+)["']/i) || html.match(/\/property-search\/detail\/\d+\/(\d+)\//i);
    const mls = mlsAttr ? mlsAttr[1] : null;

    const photoMatch = html.match(/data-src=["'](https:\/\/cdn\.listingphotos\.sierrastatic\.com\/[^"']+)["']/i) ||
                       html.match(/src=["'](https:\/\/cdn\.listingphotos\.sierrastatic\.com\/[^"']+)["']/i) ||
                       html.match(/(https:\/\/cdn\.listingphotos\.sierrastatic\.com\/pics2x\/[^"'\s\)]+)/i);
    let photo = photoMatch ? photoMatch[1] : null;
    if (photo && photo.includes('loadingphoto')) photo = null;
    if (photo) photo = photo.replace(/\/pics1x\//i, '/pics2x/');

    const urlMatch = html.match(/data-url=["']([^"']+)["']/i) || html.match(/href=["'](\/property-search\/detail\/[^"']+)["']/i);
    const detailUrl = urlMatch ? (urlMatch[1].startsWith('http') ? urlMatch[1] : `https://www.ephomesonline.com${urlMatch[1]}`) : null;

    if (photo && mls) {
      return { mls, photo, detailUrl };
    }
  } catch (_err) {
    // Non-blocking fallback
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
    const debug = {};

    // 0. Fetch all pages of Sierra Interactive featured listings (live MLS photos & details)
    const sierraListings = await fetchSierraFeaturedListings(debug);
    const matchedMlsSet = new Set();

    // 1. Pull live Sisu listings via Follow Up Boss Sisu Sellers Pipeline
    // STRICT FILTER: Only allow 'Active' status deals in Active Listing stages (MLS Live Listings, Listed, Active)
    if (fubApiKey) {
      try {
        const fubAuth = Buffer.from(`${fubApiKey}:`).toString('base64');
        let allDeals = [];

        // Fetch Pipeline 4 (Sisu Sellers) and Pipeline 2 (Sellers) with status=Active directly
        const targetPipelines = [4, 2];
        for (const pipeId of targetPipelines) {
          let nextUrl = `https://api.followupboss.com/v1/deals?pipelineId=${pipeId}&status=Active&limit=100`;
          let pageCount = 0;
          while (nextUrl && pageCount < 5) {
            pageCount++;
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
        }

        debug.fubTotalDeals = allDeals.length;

        // STRICT FILTER: Only allow Active Listing status sellers
        // Reject all leads, appointment set, appointment met, 1st showing, signed, pending, closed, lost, pipeline
        const activeDeals = allDeals.filter(d => {
          if (d.pipelineName !== 'Sisu Sellers' && d.pipelineName !== 'Sellers') return false;
          if (d.status !== 'Active') return false;

          const stage = (d.stageName || '').toLowerCase().trim();
          const isActiveListingStage = (
            stage === 'mls live listings' || 
            stage === 'active listing' || 
            stage === 'active listings' || 
            stage === 'listed' || 
            stage === 'active'
          );

          const isExcludedStage = (
            stage.includes('appointment') || 
            stage.includes('showing') || 
            stage.includes('signed') || 
            stage.includes('pending') || 
            stage.includes('under contract') || 
            stage.includes('closed') || 
            stage.includes('lost') || 
            stage.includes('pipeline') || 
            stage.includes('archive')
          );

          const hasAddress = Boolean(d.customAddressLine1 || (d.name && /\d+/.test(d.name)));
          return isActiveListingStage && !isExcludedStage && hasAddress;
        });

        debug.fubActiveDeals = activeDeals.length;

        if (activeDeals.length > 0) {
          for (const d of activeDeals) {
            // Address extraction: handle contact names in customAddressLine1
            let address = d.customAddressLine1 || '';
            if (!/\d+/.test(address) && /\d+/.test(d.name || '')) {
              address = d.name;
            } else if (!address) {
              address = d.name || 'Listing';
            }

            const city = d.customCity || 'El Paso';
            const state = d.customState || 'TX';
            const zip = d.customPostalCode || '';
            const fullAddress = `${address}, ${city}, ${state} ${zip}`.replace(/,\s*,/g, ',').trim();
            const priceNum = typeof d.price === 'number' ? d.price : (Number(String(d.price).replace(/[^0-9.-]+/g, '')) || 0);

            // Match deal with Sierra for MLS photo, real beds, baths, sqft, MLS #
            let sierraMatch = findSierraMatch(sierraListings, fullAddress, d.name);

            // Fallback: targeted search on Sierra Interactive if not in featured list
            if (!sierraMatch) {
              const liveSearch = await searchSierraByAddress(fullAddress);
              if (liveSearch) {
                sierraMatch = {
                  mls: liveSearch.mls,
                  photo: liveSearch.photo,
                  detailUrl: liveSearch.detailUrl,
                  bedrooms: 4,
                  bathrooms: 2.5,
                  sqft: priceNum > 400000 ? 3200 : (priceNum > 250000 ? 2400 : 1800),
                  price: priceNum,
                  priceFormatted: priceNum > 0 ? `$${priceNum.toLocaleString()}` : 'Contact Team',
                  agentName: d.users?.[0]?.name || 'Brian Burds',
                  fullAddress
                };
              }
            }

            // Only permit listings that have real Sierra MLS photos
            if (!sierraMatch || !sierraMatch.photo) {
              continue;
            }

            if (sierraMatch.mls) {
              matchedMlsSet.add(sierraMatch.mls);
            }

            const bedrooms = sierraMatch.bedrooms > 0 ? sierraMatch.bedrooms : 4;
            const bathrooms = sierraMatch.bathrooms > 0 ? sierraMatch.bathrooms : 2.5;
            const sqft = sierraMatch.sqft > 0 
              ? sierraMatch.sqft 
              : (priceNum > 400000 ? 3200 : (priceNum > 250000 ? 2400 : 1800));

            const coverImage = sierraMatch.photo;
            const displayAddress = sierraMatch.fullAddress || fullAddress;
            const priceFormatted = priceNum > 0 ? `$${priceNum.toLocaleString()}` : (sierraMatch.priceFormatted || 'Contact Team');

            syncedListings.push({
              id: `fub-sisu-${d.id}`,
              sisu_listing_id: `MLS-${sierraMatch.mls}`,
              mls_number: sierraMatch.mls || '',
              address: displayAddress,
              price: priceNum || sierraMatch.price || 0,
              price_formatted: priceFormatted,
              stage: 'MLS Live Listings',
              listing_agent_id: d.users?.[0]?.email || 'brian@brianburds.com',
              listing_agent_name: d.users?.[0]?.name || sierraMatch.agentName || 'Brian Burds',
              seller_contact_name: d.people?.[0]?.name || 'Seller',
              seller_contact_id: d.people?.[0]?.id ? String(d.people[0].id) : null,
              seller_phone: '(915) 555-0100',
              sierra_url: sierraMatch.detailUrl || null,
              status: 'active',
              is_available_for_open_house: true,
              bedrooms,
              bathrooms,
              sqft,
              cover_image: coverImage,
              notes: d.customLockboxSerialNumber ? `Lockbox Serial: ${d.customLockboxSerialNumber} | MLS #${sierraMatch.mls}` : `MLS #${sierraMatch.mls}`,
              last_synced_at: new Date().toISOString()
            });
          }
        }
      } catch (fubErr) {
        console.warn('Error fetching live Sisu deals from FUB:', fubErr.message);
      }
    }

    const fubSisuCount = syncedListings.length;

    // 2. Add remaining Sierra featured listings from ephomesonline.com that were not already matched
    let addedSierraCount = 0;
    for (const s of sierraListings) {
      if (s.mls && matchedMlsSet.has(s.mls)) continue;
      if (!s.photo) continue;

      addedSierraCount++;
      syncedListings.push({
        id: `sierra-${s.mls || s.street.replace(/\s+/g, '-').toLowerCase()}`,
        sisu_listing_id: s.mls ? `MLS-${s.mls}` : `SIERRA-${addedSierraCount}`,
        mls_number: s.mls || '',
        address: s.fullAddress,
        price: s.price,
        price_formatted: s.priceFormatted,
        stage: 'MLS Live Listings',
        listing_agent_id: 'brian@brianburds.com',
        listing_agent_name: s.agentName || 'Brian Burds',
        seller_contact_name: 'Listing Client',
        seller_contact_id: null,
        seller_phone: '(915) 555-0100',
        sierra_url: s.detailUrl || null,
        status: 'active',
        is_available_for_open_house: true,
        bedrooms: s.bedrooms || 3,
        bathrooms: s.bathrooms || 2,
        sqft: s.sqft || 1800,
        cover_image: s.photo,
        notes: `MLS Live Listing #${s.mls || 'N/A'} from ephomesonline.com`,
        last_synced_at: new Date().toISOString()
      });
    }

    // 3. Fallback: If live network calls were blocked or yielded 0, load the clean stored inventory from Supabase
    if (syncedListings.length === 0 && supabase) {
      try {
        const { data: configRow } = await supabase
          .from('agents')
          .select('profile')
          .eq('id', '__SYSTEM_CONFIG_LISTINGS__')
          .single();
        if (configRow?.profile?.listings && Array.isArray(configRow.profile.listings) && configRow.profile.listings.length > 0) {
          syncedListings = configRow.profile.listings;
          source = 'supabase_active_cache';
        }
      } catch (_cacheErr) {
        // Fallback
      }
    }

    // Upsert clean active listings into Supabase cloud config if we have fresh live listings
    if (supabase && syncedListings.length > 0 && source !== 'supabase_active_cache') {
      try {
        await supabase.from('agents').upsert([{
          id: '__SYSTEM_CONFIG_LISTINGS__',
          name: 'Listings & Sisu/FUB Inventory Config',
          status: 'system',
          profile: {
            listings: syncedListings,
            last_synced_at: new Date().toISOString(),
            total_count: syncedListings.length,
            sisu_count: fubSisuCount,
            sierra_count: addedSierraCount
          }
        }]);
      } catch (dbErr) {
        console.warn('Database save warning:', dbErr.message);
      }
    }

    return res.status(200).json({
      success: true,
      source,
      count: syncedListings.length,
      sisuCount: fubSisuCount,
      sierraCount: addedSierraCount,
      syncedAt: new Date().toISOString(),
      debug,
      listings: syncedListings
    });
  } catch (err) {
    console.error('Failed to sync Sisu listings:', err);
    return res.status(500).json({ error: 'Internal Server Error during Sisu listing sync', message: err.message });
  }
}
