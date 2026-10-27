/**
 * Utility functions for parsing, normalizing, and embedding various media types:
 * - Canva Presentations & Designs
 * - Tango.ai Interactive Walkthroughs & Workflows
 * - YouTube Videos & Shorts
 * - Loom Screen Recordings
 * - Vimeo Videos
 * - Google Slides
 * - Scribehow Guides
 * - Direct MP4 / WebM Videos
 * - Generic <iframe> Embed Code
 */

// Cache for resolved shortlinks (e.g. canva.link -> canva.com/design/.../view?embed)
const SHORTLINK_CACHE_KEY = 'exp_resolved_media_urls';

// Pre-seeded known links so they resolve instantaneously without network
let shortlinkMemoryCache = {
  'https://canva.link/a8cqg3z8b10sm3o': 'https://www.canva.com/design/DAHVLtWMOxo/SwvFayAGeepDu3VxTk3gnw/view?embed',
  'http://canva.link/a8cqg3z8b10sm3o': 'https://www.canva.com/design/DAHVLtWMOxo/SwvFayAGeepDu3VxTk3gnw/view?embed',
  'canva.link/a8cqg3z8b10sm3o': 'https://www.canva.com/design/DAHVLtWMOxo/SwvFayAGeepDu3VxTk3gnw/view?embed'
};

if (typeof window !== 'undefined' && window.localStorage) {
  try {
    const stored = window.localStorage.getItem(SHORTLINK_CACHE_KEY);
    if (stored) {
      shortlinkMemoryCache = { ...shortlinkMemoryCache, ...JSON.parse(stored) };
    }
  } catch (_err) {
    // Ignore storage errors
  }
}

export function cacheResolvedUrl(originalUrl, resolvedUrl) {
  if (!originalUrl || !resolvedUrl) return;
  const key = originalUrl.trim();
  shortlinkMemoryCache[key] = resolvedUrl.trim();
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(SHORTLINK_CACHE_KEY, JSON.stringify(shortlinkMemoryCache));
    } catch (_err) {
      // Ignore storage errors
    }
  }
}

export function getCachedResolvedUrl(originalUrl) {
  if (!originalUrl) return null;
  const trimmed = originalUrl.trim();
  return (
    shortlinkMemoryCache[trimmed] ||
    shortlinkMemoryCache[trimmed.replace(/^https?:\/\//i, '')] ||
    shortlinkMemoryCache[`https://${trimmed.replace(/^https?:\/\//i, '')}`] ||
    null
  );
}

/**
 * Transforms any Canva design URL into its iframe-embeddable equivalent with ?embed.
 */
export function toCanvaEmbedUrl(inputUrl) {
  if (!inputUrl || typeof inputUrl !== 'string') return null;
  const clean = inputUrl.trim();

  // If already has embed parameter
  if (clean.includes('canva.com/design/') && (clean.includes('?embed') || clean.includes('&embed'))) {
    return clean;
  }

  // Handle canva.com/design/DAG.../...
  if (clean.includes('canva.com/design/')) {
    try {
      const urlObj = new URL(clean.startsWith('http') ? clean : `https://${clean}`);
      let path = urlObj.pathname;
      if (path.endsWith('/edit') || path.endsWith('/watch') || path.endsWith('/present')) {
        path = path.replace(/\/(edit|watch|present)$/, '/view');
      } else if (!path.endsWith('/view')) {
        path = `${path.replace(/\/$/, '')}/view`;
      }
      return `https://www.canva.com${path}?embed`;
    } catch (_err) {
      const base = clean.split('?')[0].replace(/\/(edit|watch|present)$/, '/view');
      return `${base}?embed`;
    }
  }

  return clean;
}

/**
 * Asynchronously resolves shortlinks (like canva.link) or redirecting URLs
 * using the backend API / dev server middleware, caching the result.
 */
export async function resolveMediaUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  const clean = extractIframeSrc(rawUrl).trim();
  if (!clean) return null;

  // 1. Check if already directly an embeddable Canva URL
  if (clean.includes('canva.com/design/') && (clean.includes('?embed') || clean.includes('&embed'))) {
    return clean;
  }

  // 2. If it's a canva.com design URL without ?embed, convert it immediately
  if (clean.includes('canva.com/design/')) {
    const embed = toCanvaEmbedUrl(clean);
    cacheResolvedUrl(clean, embed);
    return embed;
  }

  // 3. Check cache for shortlinks
  const cached = getCachedResolvedUrl(clean);
  if (cached) {
    return toCanvaEmbedUrl(cached);
  }

  // 4. If not a shortlink needing resolution, return as-is
  if (!clean.includes('canva.link') && !clean.includes('canva.me')) {
    return clean;
  }

  // 5. Query resolution API
  try {
    const fullUrl = clean.startsWith('http') ? clean : `https://${clean}`;
    const res = await fetch(`/api/resolve-media?url=${encodeURIComponent(fullUrl)}`);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const data = await res.json();
    if (data && data.resolvedUrl) {
      const finalEmbed = toCanvaEmbedUrl(data.resolvedUrl);
      cacheResolvedUrl(clean, finalEmbed);
      cacheResolvedUrl(fullUrl, finalEmbed);
      return finalEmbed;
    }
  } catch (err) {
    console.warn('[mediaEmbed] Could not resolve shortlink:', err);
  }

  return null;
}

/**
 * Extracts src from an iframe tag if the user pasted raw HTML embed code.
 */
export function extractIframeSrc(input) {
  if (!input || typeof input !== 'string') return '';
  let trimmed = input.trim();

  // Decode common HTML entities (Canva HTML snippet often has &#x2F;)
  trimmed = trimmed
    .replace(/&#x2F;/gi, '/')
    .replace(/&#47;/g, '/')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
  
  // Match <iframe ... src="URL" ...> or src='URL'
  const iframeMatch = trimmed.match(/<iframe[^>]+src=["']([^"']+)["']/i);
  if (iframeMatch && iframeMatch[1]) {
    return iframeMatch[1].trim();
  }

  // Also check for standard URL inside any tag or raw text
  return trimmed;
}

/**
 * Parses and transforms any raw input (URL or iframe embed snippet) into a structured media object.
 */
export function parseEmbedMedia(rawInput) {
  if (!rawInput || typeof rawInput !== 'string') {
    return {
      type: 'empty',
      rawUrl: '',
      embedUrl: null,
      isDirectVideo: false,
      isPresentation: false,
      isWalkthrough: false,
      title: ''
    };
  }

  const cleanInput = extractIframeSrc(rawInput).trim();
  if (!cleanInput) {
    return {
      type: 'empty',
      rawUrl: '',
      embedUrl: null,
      isDirectVideo: false,
      isPresentation: false,
      isWalkthrough: false,
      title: ''
    };
  }

  // 1. CANVA PRESENTATIONS & DESIGNS
  // Formats:
  // - https://canva.link/<shortId> (Canva share shortlink)
  // - https://www.canva.com/design/DAG.../.../view?embed
  // - https://www.canva.com/design/DAG.../.../view
  // - https://www.canva.com/design/DAG.../.../watch
  // - https://www.canva.com/design/DAG.../.../present
  // - https://www.canva.com/design/DAG.../.../edit
  // - Raw Canva <iframe> embed snippets
  const isCanva = cleanInput.includes('canva.com/design/') || cleanInput.includes('canva.link/') || cleanInput.includes('canva.me/');
  if (isCanva) {
    const isShortLink = cleanInput.includes('canva.link/') || cleanInput.includes('canva.me/');
    let embedUrl = null;

    if (isShortLink) {
      const cached = getCachedResolvedUrl(cleanInput);
      if (cached) {
        embedUrl = toCanvaEmbedUrl(cached);
      }
    } else {
      embedUrl = toCanvaEmbedUrl(cleanInput);
    }

    return {
      type: 'canva',
      rawUrl: cleanInput,
      embedUrl,
      isShortLink,
      needsResolution: isShortLink && !embedUrl,
      isDirectVideo: false,
      isPresentation: true,
      isWalkthrough: false,
      badgeLabel: 'Canva Presentation',
      badgeColor: '#7d2ae8',
      aspectRatio: '16/9',
      minHeight: '480px'
    };
  }

  // 2. TANGO.AI WALKTHROUGHS & WORKFLOWS
  // Formats:
  // - https://app.tango.us/app/workflow/Title-12345-6789...
  // - https://app.tango.us/app/workflow/12345-6789...
  // - https://app.tango.us/embed/12345-6789...
  // - https://tango.us/workflow/...
  if (cleanInput.includes('tango.us/')) {
    let embedUrl = cleanInput;
    try {
      const urlObj = new URL(cleanInput.startsWith('http') ? cleanInput : `https://${cleanInput}`);
      
      if (!urlObj.searchParams.has('iframe')) {
        urlObj.searchParams.set('iframe', 'true');
      }
      embedUrl = urlObj.toString();
    } catch (_err) {
      if (!embedUrl.includes('iframe=true')) {
        embedUrl = embedUrl.includes('?') ? `${embedUrl}&iframe=true` : `${embedUrl}?iframe=true`;
      }
    }

    return {
      type: 'tango',
      rawUrl: cleanInput,
      embedUrl,
      isDirectVideo: false,
      isPresentation: false,
      isWalkthrough: true,
      badgeLabel: 'Tango.ai Walkthrough',
      badgeColor: '#ec4899',
      aspectRatio: '16/10',
      minHeight: '580px'
    };
  }

  // 3. YOUTUBE VIDEOS & SHORTS
  if (cleanInput.includes('youtube.com/watch') || cleanInput.includes('youtu.be/') || cleanInput.includes('youtube.com/shorts/') || cleanInput.includes('youtube.com/embed/')) {
    let vidId = '';
    if (cleanInput.includes('youtube.com/watch?v=')) {
      vidId = cleanInput.split('v=')[1]?.split('&')[0];
    } else if (cleanInput.includes('youtu.be/')) {
      vidId = cleanInput.split('youtu.be/')[1]?.split('?')[0];
    } else if (cleanInput.includes('youtube.com/shorts/')) {
      vidId = cleanInput.split('youtube.com/shorts/')[1]?.split('?')[0];
    } else if (cleanInput.includes('youtube.com/embed/')) {
      vidId = cleanInput.split('youtube.com/embed/')[1]?.split('?')[0];
    }

    return {
      type: 'youtube',
      rawUrl: cleanInput,
      embedUrl: vidId ? `https://www.youtube.com/embed/${vidId}?rel=0` : cleanInput,
      isDirectVideo: false,
      isPresentation: false,
      isWalkthrough: false,
      badgeLabel: 'YouTube Video',
      badgeColor: '#ef4444',
      aspectRatio: '16/9',
      minHeight: '420px'
    };
  }

  // 4. LOOM RECORDINGS
  if (cleanInput.includes('loom.com/share/') || cleanInput.includes('loom.com/embed/')) {
    const loomId = cleanInput.includes('loom.com/share/')
      ? cleanInput.split('loom.com/share/')[1]?.split('?')[0]
      : cleanInput.split('loom.com/embed/')[1]?.split('?')[0];

    return {
      type: 'loom',
      rawUrl: cleanInput,
      embedUrl: loomId ? `https://www.loom.com/embed/${loomId}` : cleanInput,
      isDirectVideo: false,
      isPresentation: false,
      isWalkthrough: false,
      badgeLabel: 'Loom Video',
      badgeColor: '#6366f1',
      aspectRatio: '16/9',
      minHeight: '420px'
    };
  }

  // 5. VIMEO VIDEOS
  if (cleanInput.includes('vimeo.com/')) {
    const vimeoId = cleanInput.includes('player.vimeo.com/video/')
      ? cleanInput.split('player.vimeo.com/video/')[1]?.split('?')[0]
      : cleanInput.split('vimeo.com/')[1]?.split('?')[0]?.replace(/[^\d]/g, '');

    return {
      type: 'vimeo',
      rawUrl: cleanInput,
      embedUrl: vimeoId ? `https://player.vimeo.com/video/${vimeoId}` : cleanInput,
      isDirectVideo: false,
      isPresentation: false,
      isWalkthrough: false,
      badgeLabel: 'Vimeo Video',
      badgeColor: '#0ea5e9',
      aspectRatio: '16/9',
      minHeight: '420px'
    };
  }

  // 6. GOOGLE SLIDES
  if (cleanInput.includes('docs.google.com/presentation/')) {
    let embedUrl = cleanInput;
    if (cleanInput.includes('/edit') || cleanInput.includes('/pub')) {
      const base = cleanInput.split(/\/edit|\/pub/)[0];
      embedUrl = `${base}/embed?start=false&loop=false&delayms=3000`;
    }

    return {
      type: 'slides',
      rawUrl: cleanInput,
      embedUrl,
      isDirectVideo: false,
      isPresentation: true,
      isWalkthrough: false,
      badgeLabel: 'Google Slides',
      badgeColor: '#eab308',
      aspectRatio: '16/9',
      minHeight: '450px'
    };
  }

  // 7. SCRIBEHOW GUIDES
  if (cleanInput.includes('scribehow.com/')) {
    let embedUrl = cleanInput;
    if (cleanInput.includes('scribehow.com/shared/')) {
      embedUrl = cleanInput.replace('scribehow.com/shared/', 'scribehow.com/embed/');
    }

    return {
      type: 'scribe',
      rawUrl: cleanInput,
      embedUrl,
      isDirectVideo: false,
      isPresentation: false,
      isWalkthrough: true,
      badgeLabel: 'Scribe Guide',
      badgeColor: '#f97316',
      aspectRatio: '16/10',
      minHeight: '560px'
    };
  }

  // 8. DIRECT HTML5 VIDEO FILES (MP4, WebM, MOV, OGG)
  const isVideoFile = /\.(mp4|webm|mov|m4v|ogg)(\?.*)?$/i.test(cleanInput);
  if (isVideoFile) {
    return {
      type: 'video',
      rawUrl: cleanInput,
      embedUrl: cleanInput,
      isDirectVideo: true,
      isPresentation: false,
      isWalkthrough: false,
      badgeLabel: 'MP4 Video',
      badgeColor: '#10b981',
      aspectRatio: '16/9',
      minHeight: '420px'
    };
  }

  // 9. GENERIC HTTPS EMBED OR IFRAME
  if (cleanInput.startsWith('http://') || cleanInput.startsWith('https://')) {
    return {
      type: 'generic',
      rawUrl: cleanInput,
      embedUrl: cleanInput,
      isDirectVideo: false,
      isPresentation: false,
      isWalkthrough: false,
      badgeLabel: 'Web Embed',
      badgeColor: '#64748b',
      aspectRatio: '16/9',
      minHeight: '450px'
    };
  }

  return {
    type: 'unknown',
    rawUrl: cleanInput,
    embedUrl: null,
    isDirectVideo: false,
    isPresentation: false,
    isWalkthrough: false,
    badgeLabel: 'Link',
    badgeColor: '#64748b'
  };
}
