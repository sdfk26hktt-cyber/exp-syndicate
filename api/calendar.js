import { createClient } from '@supabase/supabase-js';
import * as ics from 'ics';

// Initialize Supabase client inside the handler or outside if env vars are loaded
// In Vercel, env vars are available on process.env
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase credentials not found in environment.');
}

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!supabase) {
    return res.status(500).json({ error: 'Database configuration missing' });
  }

  try {
    // Fetch approved events
    const { data: events, error } = await supabase
      .from('events')
      .select('*')
      .eq('status', 'approved');

    if (error || !events) {
      return res.status(500).json({ error: 'Failed to fetch events' });
    }

    // Helper to convert Mountain Time to a UTC array handling DST correctly
    const getUtcArrayFromMountainTime = (y, m, d, h, min) => {
      const isDST = () => {
        if (m < 3 || m > 11) return false;
        if (m > 3 && m < 11) return true;
        const previousSunday = d - new Date(y, m - 1, d).getDay();
        if (m === 3) return previousSunday >= 8;
        return previousSunday <= 0;
      };
      const offset = isDST() ? 6 : 7;
      const utcDate = new Date(Date.UTC(y, m - 1, d, h + offset, min));
      return [utcDate.getUTCFullYear(), utcDate.getUTCMonth() + 1, utcDate.getUTCDate(), utcDate.getUTCHours(), utcDate.getUTCMinutes()];
    };

    const icsEvents = events.reduce((acc, evt) => {
      // Parse the date (YYYY-MM-DD) and time (HH:MM)
      let year = NaN, month = NaN, day = NaN;
      if (evt.date && typeof evt.date === 'string' && evt.date.includes('-')) {
        const parts = evt.date.split('-');
        year = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10);
        day = parseInt(parts[2], 10);
      }
      
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

      // Default duration is 1 hour since we don't have an end time in the DB
      acc.push({
        title: evt.title || 'Training Event',
        description: (evt.instructor ? `Instructor: ${evt.instructor}\n\n` : '') + (evt.description || '') + (evt.link ? `\nLink: ${evt.link}` : ''),
        start: getUtcArrayFromMountainTime(year, month, day, isNaN(hour) ? 12 : hour, isNaN(minute) ? 0 : minute),
        startInputType: 'utc',
        startOutputType: 'utc',
        duration: { hours: 1, minutes: 0 },
        categories: [evt.type || 'general'],
        uid: `evt-${evt.id || Math.random().toString(36).substring(7)}@expsyndicate.com`,
        status: 'CONFIRMED',
      });
      return acc;
    }, []);

    const { error: icsError, value } = ics.createEvents(icsEvents);

    if (icsError) {
      console.error('ICS creation error:', icsError);
      return res.status(500).json({ error: 'Failed to generate calendar' });
    }

    // Set headers for iCalendar file download
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="training-calendar.ics"');
    res.status(200).send(value);
  } catch (err) {
    console.error('Unhandled server error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
