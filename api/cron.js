import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // Check authorization header to verify Vercel Cron
  // You can set CRON_SECRET in Vercel env vars to secure this
  const authHeader = req.headers.authorization;
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  const resendApiKey = process.env.RESEND_API_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'Missing Supabase credentials in environment' });
  }
  
  if (!resendApiKey) {
    console.error('Missing Resend API key. Cannot send email.');
    return res.status(500).json({ error: 'Missing Resend API key in environment' });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { data: agents, error } = await supabase.from('agents').select('*');
    if (error) throw error;

    // Filter for tasks completed in the last 24 hours
    const yesterday = new Date();
    yesterday.setHours(yesterday.getHours() - 24);
    
    let reportHtml = `<h2>Daily Playbook Recap - ${new Date().toLocaleDateString()}</h2>`;
    let totalTasksCompleted = 0;

    agents.forEach(agent => {
      let agentTasksHtml = '';
      if (agent.phases) {
        agent.phases.forEach(phase => {
          if (phase.items) {
            phase.items.forEach(item => {
              if (item.completed && item.completedAt) {
                const completedDate = new Date(item.completedAt);
                if (completedDate > yesterday) {
                  agentTasksHtml += `<li><strong>${item.text}</strong> (Phase: ${phase.title})</li>`;
                  totalTasksCompleted++;
                }
              }
            });
          }
        });
      }
      
      if (agentTasksHtml) {
        reportHtml += `<h3>${agent.name} (${agent.id})</h3><ul>${agentTasksHtml}</ul>`;
      }
    });

    if (totalTasksCompleted === 0) {
      reportHtml += `<p>No playbook tasks were completed by any agents today.</p>`;
    }

    // Send via Resend API
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`
      },
      body: JSON.stringify({
        from: 'The Syndicate <reports@expsyndicate.com>',
        to: ['onboarding@brianburds.com'],
        subject: `Daily Playbook Recap - ${totalTasksCompleted} tasks completed`,
        html: reportHtml
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Resend API Error: ${errorData}`);
    }

    res.status(200).json({ message: 'Daily recap sent successfully', tasksCount: totalTasksCompleted });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
