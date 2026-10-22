import { createClient } from '@supabase/supabase-js';
import * as ics from 'ics';

const getSupabase = () => {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.warn('Supabase credentials not found in environment.');
    return null;
  }
  return createClient(supabaseUrl, supabaseKey);
};

// Helper to convert Mountain Time (America/Denver / America/El_Paso) to UTC array [y, m, d, h, min]
const getUtcArrayFromMountainTime = (y, m, d, h, min) => {
  try {
    const dtStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}T${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}:00`;
    const targetUtcEstimate = new Date(`${dtStr}Z`);
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Denver',
      timeZoneName: 'shortOffset'
    }).formatToParts(targetUtcEstimate);
    const tzPart = parts.find(p => p.type === 'timeZoneName')?.value || 'GMT-7';
    const match = tzPart.match(/GMT([+-]\d+)/);
    const offsetHours = match ? parseInt(match[1], 10) : -7;

    const utcDate = new Date(Date.UTC(y, m - 1, d, h - offsetHours, min));
    return [
      utcDate.getUTCFullYear(),
      utcDate.getUTCMonth() + 1,
      utcDate.getUTCDate(),
      utcDate.getUTCHours(),
      utcDate.getUTCMinutes()
    ];
  } catch (e) {
    const utcDate = new Date(Date.UTC(y, m - 1, d, h + 7, min));
    return [
      utcDate.getUTCFullYear(),
      utcDate.getUTCMonth() + 1,
      utcDate.getUTCDate(),
      utcDate.getUTCHours(),
      utcDate.getUTCMinutes()
    ];
  }
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

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

    const icsEvents = trainingEvents.reduce((acc, evt) => {
      // Parse the date (YYYY-MM-DD)
      let year = NaN, month = NaN, day = NaN;
      if (evt.date && typeof evt.date === 'string' && evt.date.includes('-')) {
        const parts = evt.date.split('-');
        year = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10);
        day = parseInt(parts[2], 10);
      }

      // Parse start time (HH:MM)
      let hour = 12, minute = 0;
      if (evt.time && typeof evt.time === 'string' && evt.time.includes(':')) {
        const parts = evt.time.split(':');
        hour = parseInt(parts[0], 10);
        minute = parseInt(parts[1], 10);
      }

      // Skip events with totally invalid dates
      if (isNaN(year) || isNaN(month) || isNaN(day)) {
        return acc;
      }

      // Calculate duration if end_time is provided, otherwise default to 1 hour
      let duration = { hours: 1, minutes: 0 };
      const endTimeStr = evt.end_time || evt.endTime;
      if (endTimeStr && typeof endTimeStr === 'string' && endTimeStr.includes(':')) {
        const endParts = endTimeStr.split(':');
        const endHour = parseInt(endParts[0], 10);
        const endMin = parseInt(endParts[1], 10);
        if (!isNaN(endHour) && !isNaN(endMin)) {
          const startTotalMin = (isNaN(hour) ? 12 : hour) * 60 + (isNaN(minute) ? 0 : minute);
          const endTotalMin = endHour * 60 + endMin;
          const diff = endTotalMin - startTotalMin;
          if (diff > 0) {
            duration = { hours: Math.floor(diff / 60), minutes: diff % 60 };
          }
        }
      }

      const description = [
        evt.instructor ? `Instructor: ${evt.instructor}` : null,
        evt.submitted_by || evt.submittedBy ? `Suggested By: ${evt.submitted_by || evt.submittedBy}` : null,
        evt.description ? evt.description : null,
        evt.link ? `Link: ${evt.link}` : null
      ].filter(Boolean).join('\n\n');

      acc.push({
        title: evt.title || 'Training Event',
        description: description || undefined,
        location: evt.location || undefined,
        url: evt.link || undefined,
        start: getUtcArrayFromMountainTime(year, month, day, isNaN(hour) ? 12 : hour, isNaN(minute) ? 0 : minute),
        startInputType: 'utc',
        startOutputType: 'utc',
        duration,
        categories: [evt.type || 'general'],
        calName: 'eXp Syndicate Training Calendar',
        uid: `evt-${evt.id || Math.random().toString(36).substring(7)}@expsyndicate.com`,
        status: 'CONFIRMED',
      });
      return acc;
    }, []);

    const { error: icsError, value } = ics.createEvents(icsEvents, {
      calName: 'eXp Syndicate Training Calendar'
    });

    if (icsError) {
      console.error('ICS creation error:', icsError);
      return res.status(500).json({ error: 'Failed to generate calendar' });
    }

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

    res.status(200).send(value);
  } catch (err) {
    console.error('Unhandled server error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
