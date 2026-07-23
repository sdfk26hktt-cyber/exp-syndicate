import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

export default async function handler(req, res) {
  try {
    // Vercel CRON authentication (optional but recommended)
    const authHeader = req.headers.authorization;
    if (
      process.env.CRON_SECRET && 
      authHeader !== `Bearer ${process.env.CRON_SECRET}`
    ) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
    const resendKey = process.env.RESEND_API_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration.');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const resend = new Resend(resendKey);

    // Fetch agents from database
    const { data: agents, error } = await supabase.from('agents').select('*');
    
    if (error) {
      throw error;
    }

    // Determine 'today' in MST (or whatever timezone the server considers today)
    // To be safe, we'll just check if completedAt includes today's date string (YYYY-MM-DD)
    const today = new Date().toISOString().split('T')[0];

    const completedTasksByAgent = [];

    for (const agent of agents) {
      if (!agent.phases) continue;

      const completedToday = [];

      agent.phases.forEach(phase => {
        if (!phase.items) return;
        phase.items.forEach(item => {
          if (item.completed && item.completedAt && item.completedAt.startsWith(today)) {
            completedToday.push(item);
          }
        });
      });

      if (completedToday.length > 0) {
        completedTasksByAgent.push({
          agent,
          tasks: completedToday
        });
      }
    }

    if (completedTasksByAgent.length === 0) {
      return res.status(200).json({ message: 'No tasks completed today. Email skipped.' });
    }

    // Format email HTML
    let htmlContent = `
      <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
        <h2>Daily Onboarding Recap</h2>
        <p>Here are the playbook tasks completed by agents today (${today}):</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
    `;

    completedTasksByAgent.forEach(({ agent, tasks }) => {
      htmlContent += `
        <div style="margin-bottom: 20px;">
          <h3 style="margin: 0 0 10px 0; color: #2563eb;">${agent.name || agent.email}</h3>
          <ul style="margin: 0; padding-left: 20px;">
      `;
      tasks.forEach(task => {
        htmlContent += `<li style="margin-bottom: 5px;">${task.text} <em>(+${task.xp} XP)</em></li>`;
      });
      htmlContent += `
          </ul>
        </div>
      `;
    });

    htmlContent += `
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #999;">This is an automated message from the eXp Syndicate Onboarding Tracker.</p>
      </div>
    `;

    const { data: emailData, error: emailError } = await resend.emails.send({
      from: 'onboarding@expsyndicate.com',
      to: ['onboarding@brianburds.com'],
      subject: `Agent Progress Recap - ${today}`,
      html: htmlContent,
    });

    if (emailError) {
      throw emailError;
    }

    return res.status(200).json({ 
      success: true, 
      message: `Email sent successfully to onboarding@brianburds.com with ${completedTasksByAgent.length} agents updated.`,
      emailData
    });

  } catch (err) {
    console.error('Error in daily-recap cron:', err);
    return res.status(500).json({ error: err.message });
  }
}
