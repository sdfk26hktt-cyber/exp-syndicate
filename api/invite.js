export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { email, name } = req.body;

  if (!email || !name) {
    return res.status(400).json({ error: 'Missing email or name' });
  }

  const resendApiKey = process.env.RESEND_API_KEY;

  if (!resendApiKey) {
    console.error('Missing Resend API key. Cannot send email.');
    return res.status(500).json({ error: 'Missing Resend API key in environment' });
  }

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <h2 style="color: #2563eb;">Welcome to The eXp Syndicate, ${name}!</h2>
      <p>You have been officially invited to join The Syndicate portal.</p>
      <p>Our platform tracks your onboarding progress, provides playbooks for your real estate journey, and connects you with the community.</p>
      
      <div style="background-color: #f3f4f6; padding: 1.5rem; border-radius: 8px; margin: 1.5rem 0;">
        <h3 style="margin-top: 0;">How to Log In:</h3>
        <ol style="margin-bottom: 0;">
          <li>Click the button below to go to the portal.</li>
          <li>Enter this email address: <strong>${email}</strong></li>
          <li>You will receive a secure 6-digit code to this inbox.</li>
          <li>Enter the code to access your dashboard!</li>
        </ol>
      </div>
      
      <div style="text-align: center; margin: 2rem 0;">
        <a href="https://www.expsyndicate.com/login" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Log in to the Portal</a>
      </div>
      
      <p>If you have any questions, feel free to reach out to your sponsor.</p>
      <p>Best,<br>The Syndicate Team</p>
    </div>
  `;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`
      },
      body: JSON.stringify({
        from: 'The Syndicate <onboarding@expsyndicate.com>',
        to: [email],
        subject: `Welcome to The Syndicate, ${name}!`,
        html: htmlContent
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Resend API Error: ${errorData}`);
    }

    res.status(200).json({ message: 'Invitation email sent successfully' });
  } catch (err) {
    console.error('Failed to send invitation email:', err);
    res.status(500).json({ error: err.message });
  }
}
