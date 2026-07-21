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

    if (error) {
      console.error('Supabase query error:', error);
      return res.status(500).json({ error: 'Failed to fetch events' });
    }

    const icsEvents = events.map(evt => {
      // Parse the date (YYYY-MM-DD) and time (HH:MM)
      let year = 2024, month = 1, day = 1;
      if (evt.date && evt.date.includes('-')) {
        const parts = evt.date.split('-');
        year = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10);
        day = parseInt(parts[2], 10);
      }
      
      let hour = 12, minute = 0;
      if (evt.time && evt.time.includes(':')) {
        const parts = evt.time.split(':');
        hour = parseInt(parts[0], 10);
        minute = parseInt(parts[1], 10);
      }

      // Default duration is 1 hour since we don't have an end time in the DB
      return {
        title: evt.title || 'Training Event',
        description: (evt.description || '') + (evt.link ? `\nLink: ${evt.link}` : ''),
        location: evt.location || evt.link || '',
        // Format: [year, month, day, hour, minute]
        start: [year, month, day, hour, minute],
        duration: { hours: 1, minutes: 0 },
        categories: [evt.type || 'general'],
        url: evt.link || null,
        uid: `evt-${evt.id}@expsyndicate.com`,
        status: 'CONFIRMED',
      };
    });

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
