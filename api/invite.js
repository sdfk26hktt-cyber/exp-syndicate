export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { email, name, password, tempPassword } = req.body;
  const initialPassword = password || tempPassword;

  if (!email || !name) {
    return res.status(400).json({ error: 'Missing email or name' });
  }

  const resendApiKey = process.env.RESEND_API_KEY;

  if (!resendApiKey) {
    console.error('Missing Resend API key. Cannot send email.');
    return res.status(500).json({ error: 'Missing Resend API key in environment' });
  }

  const loginInstructions = initialPassword ? `
    <div style="background-color: #f3f4f6; padding: 1.5rem; border-radius: 8px; margin: 1.5rem 0;">
      <h3 style="margin-top: 0; color: #1e293b;">Your Account Login Credentials:</h3>
      <p style="margin: 0.5rem 0;"><strong>Email:</strong> ${email}</p>
      <p style="margin: 0.5rem 0;"><strong>Temporary Password:</strong> <code style="background-color: #e2e8f0; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 1.1em;">${initialPassword}</code></p>
      <p style="font-size: 0.9em; color: #64748b; margin-top: 0.75rem;">
        <em>Note: You can also choose to log in at any time using a single-use 6-digit email code. Once logged in, you can update your password in Settings.</em>
      </p>
    </div>
  ` : `
    <div style="background-color: #f3f4f6; padding: 1.5rem; border-radius: 8px; margin: 1.5rem 0;">
      <h3 style="margin-top: 0; color: #1e293b;">How to Log In:</h3>
      <ol style="margin-bottom: 0; line-height: 1.6;">
        <li>Click the button below to go to the portal.</li>
        <li>Enter this email address: <strong>${email}</strong></li>
        <li>Sign in with your password or request a 6-digit email code.</li>
        <li>Access your onboarding playbooks and agent dashboard!</li>
      </ol>
    </div>
  `;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.6;">
      <h2 style="color: #2563eb;">Welcome to The eXp Syndicate, ${name}!</h2>
      <p>You have been officially invited to join The Syndicate portal.</p>
      <p>Our platform tracks your onboarding progress, provides playbooks for your real estate journey, and connects you with the community.</p>
      
      ${loginInstructions}
      
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
