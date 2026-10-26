import { createClient } from '@supabase/supabase-js';

const getSupabase = () => {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.warn('Supabase credentials not found in environment.');
    return null;
  }
  return createClient(supabaseUrl, supabaseKey);
};

/**
 * Converts a Mountain Time (America/Denver) date & time to a UTC Date object.
 * Correctly accounts for Daylight Saving Time (MST UTC-7 vs MDT UTC-6).
 */
function parseMountainTimeToUtc(dateStr, timeStr = '12:00') {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const dateParts = dateStr.split('-').map(Number);
  if (dateParts.length < 3) return null;
  const [year, month, day] = dateParts;
  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;

  let hour = 12;
  let minute = 0;
  if (timeStr && typeof timeStr === 'string' && timeStr.includes(':')) {
    const timeParts = timeStr.split(':').map(Number);
    if (!isNaN(timeParts[0])) hour = timeParts[0];
    if (!isNaN(timeParts[1])) minute = timeParts[1];
  }

  // Determine timezone offset for America/Denver at this specific date & time
  const isoStr = `${dateStr}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;
  const testDate = new Date(`${isoStr}Z`);
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Denver',
    timeZoneName: 'longOffset'
  });
  const parts = dtf.formatToParts(testDate);
  const tzOffset = parts.find(p => p.type === 'timeZoneName')?.value || 'GMT-07:00';
  const offsetMatch = tzOffset.match(/GMT([+-])(\d{2}):(\d{2})/);
  const sign = offsetMatch ? (offsetMatch[1] === '-' ? -1 : 1) : -1;
  const offH = offsetMatch ? parseInt(offsetMatch[2], 10) : 7;
  const offM = offsetMatch ? parseInt(offsetMatch[3], 10) : 0;
  const totalOffsetMin = sign * (offH * 60 + offM);

  const utcMs = Date.UTC(year, month - 1, day, hour, minute) - totalOffsetMin * 60 * 1000;
  return new Date(utcMs);
}

/**
 * Formats a Date object to RFC 5545 UTC timestamp format (YYYYMMDDTHHMMSSZ).
 */
function formatIcsDateTime(date) {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/**
 * Escapes text according to RFC 5545 TEXT property value rules.
 * Backslashes, semicolons, and commas are escaped with a backslash; newlines become literal \n.
 */
function escapeIcsText(str) {
  if (!str) return '';
  return String(str)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/**
 * RFC 5545 line folding: Content lines SHOULD NOT exceed 75 octets.
 * Continuation lines start with a single whitespace character (space).
 */
function foldLine(line) {
  if (line.length <= 75) return line;
  const parts = [];
  let remaining = line;
  parts.push(remaining.slice(0, 75));
  remaining = remaining.slice(75);
  while (remaining.length > 74) {
    parts.push(' ' + remaining.slice(0, 74));
    remaining = remaining.slice(74);
  }
  if (remaining.length > 0) {
    parts.push(' ' + remaining);
  }
  return parts.join('\r\n');
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return res.status(500).json({ error: 'Database configuration missing' });
  }

  try {
    // Fetch approved events
    const { data: events, error } = await supabase
      .from('events')
      .select('*')
      .eq('status', 'approved');

    if (error) {
      console.error('Failed to fetch events from Supabase:', error);
      return res.status(500).json({ error: 'Failed to fetch events' });
    }

    // Filter out open house events completely so they never sync to people's calendars or block schedules
    const trainingEvents = (events || []).filter(evt => {
      if (!evt) return false;
      const type = (evt.type || '').toLowerCase();
      const title = (evt.title || '').toLowerCase();
      const id = String(evt.id || '');
      if (id.startsWith('oh-') || type.includes('open house') || title.startsWith('open house:')) {
        return false;
      }
      return true;
    });

    const nowUtc = formatIcsDateTime(new Date());
    const eventBlocks = [];

    for (const evt of trainingEvents) {
      const startDateUtc = parseMountainTimeToUtc(evt.date, evt.time);
      if (!startDateUtc) continue;

      // Calculate end time
      let endDateUtc = null;
      const endTimeStr = evt.end_time || evt.endTime;
      if (endTimeStr && typeof endTimeStr === 'string' && endTimeStr.includes(':')) {
        endDateUtc = parseMountainTimeToUtc(evt.date, endTimeStr);
        if (endDateUtc && endDateUtc <= startDateUtc) {
          endDateUtc = new Date(startDateUtc.getTime() + 60 * 60 * 1000);
        }
      }
      if (!endDateUtc) {
        endDateUtc = new Date(startDateUtc.getTime() + 60 * 60 * 1000);
      }

      const rawId = String(evt.id || Math.random().toString(36).substring(2, 9));
      const uid = `${rawId.startsWith('evt-') ? rawId : `evt-${rawId}`}@expsyndicate.com`;
      const summary = escapeIcsText(evt.title || 'Training Event');

      const descLines = [];
      if (evt.instructor) descLines.push(`Instructor: ${evt.instructor}`);
      if (evt.submitted_by || evt.submittedBy) descLines.push(`Suggested By: ${evt.submitted_by || evt.submittedBy}`);
      if (evt.description) descLines.push(evt.description);
      if (evt.link) descLines.push(`Link: ${evt.link}`);
      const description = escapeIcsText(descLines.join('\n\n'));

      const location = escapeIcsText(evt.location || '');
      const category = escapeIcsText(evt.type || 'Training');

      const lines = [
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTAMP:${nowUtc}`,
        `DTSTART:${formatIcsDateTime(startDateUtc)}`,
        `DTEND:${formatIcsDateTime(endDateUtc)}`,
        `SUMMARY:${summary}`
      ];

      if (description) {
        lines.push(`DESCRIPTION:${description}`);
      }
      if (location) {
        lines.push(`LOCATION:${location}`);
      }
      if (category) {
        lines.push(`CATEGORIES:${category}`);
      }

      let url = null;
      if (evt.link && typeof evt.link === 'string' && evt.link.startsWith('http')) {
        url = evt.link.trim();
      } else if (evt.location && typeof evt.location === 'string' && evt.location.startsWith('http')) {
        url = evt.location.trim();
      }
      if (url) {
        lines.push(`URL:${url}`);
      }

      lines.push('STATUS:CONFIRMED');
      lines.push('END:VEVENT');

      const foldedBlock = lines.map(foldLine).join('\r\n');
      eventBlocks.push(foldedBlock);
    }

    const calendarHeader = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//eXp Syndicate//Training Calendar//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:eXp Syndicate Training Calendar',
      'X-WR-CALDESC:Live schedule of upcoming training sessions, workshops, and events for the eXp Syndicate team.',
      'X-WR-TIMEZONE:America/Denver',
      'REFRESH-INTERVAL;VALUE=DURATION:PT1H',
      'X-PUBLISHED-TTL:PT1H'
    ].map(foldLine).join('\r\n');

    const calendarFooter = 'END:VCALENDAR';

    const icsContent = `${calendarHeader}\r\n${eventBlocks.join('\r\n')}\r\n${calendarFooter}\r\n`;

    // Set headers for iCalendar feed subscription / download
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-store, max-age=0, must-revalidate');

    let isDownload = false;
    try {
      const urlObj = new URL(req.url, 'http://localhost');
      isDownload = urlObj.searchParams.get('download') === '1';
    } catch {
      isDownload = req.query?.download === '1';
    }

    res.setHeader(
      'Content-Disposition',
      isDownload ? 'attachment; filename="training-calendar.ics"' : 'inline; filename="training-calendar.ics"'
    );

    res.status(200).send(icsContent);
  } catch (err) {
    console.error('Unhandled server error in calendar endpoint:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
