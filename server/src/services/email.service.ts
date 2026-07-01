import axios from 'axios';

// Escape user-supplied text before interpolating into email HTML (defense-in-depth).
function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
}

export async function sendVerificationEmail(to: string, verifyUrl: string, userName: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const safeName = escapeHtml(userName);

  if (!apiKey) {
    console.warn('[Email] RESEND_API_KEY not set — logging verification link instead');
    console.log(`[Email] Verify email for ${to}: ${verifyUrl}`);
    return true;
  }

  try {
    await axios.post('https://api.resend.com/emails', {
      from: 'Sprint Society <onboarding@resend.dev>',
      to,
      subject: 'Verify your Sprint Society email',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px; background: #0A0A0F; color: #ffffff;">
          <h1 style="font-size: 24px; margin-bottom: 8px;">Sprint Society</h1>
          <p style="color: #999; margin-bottom: 32px;">Confirm your email</p>
          <p>Hey ${safeName},</p>
          <p>Welcome to Sprint Society. Confirm your email so we can keep your account secure and send you what matters.</p>
          <a href="${verifyUrl}" style="display: inline-block; margin: 24px 0; padding: 14px 32px; background: #39FF14; color: #0A0A0F; font-weight: 600; text-decoration: none; border-radius: 8px;">Verify email</a>
          <p style="color: #666; font-size: 14px;">This link expires in 24 hours. If you didn't create an account, ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #222; margin: 32px 0;" />
          <p style="color: #555; font-size: 12px;">Sprint Society by Kendu Entertainment</p>
        </div>
      `,
    }, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    return true;
  } catch (err: any) {
    console.error('[Email] Failed to send verification:', err.response?.data || err.message);
    return false;
  }
}

export async function sendPasswordResetEmail(to: string, resetUrl: string, userName: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.warn('[Email] RESEND_API_KEY not set — logging reset link instead');
    console.log(`[Email] Password reset for ${to}: ${resetUrl}`);
    return true;
  }

  try {
    await axios.post('https://api.resend.com/emails', {
      from: 'Sprint Society <onboarding@resend.dev>',
      to,
      subject: 'Reset your Sprint Society password',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px; background: #0A0A0F; color: #ffffff;">
          <h1 style="font-size: 24px; margin-bottom: 8px;">Sprint Society</h1>
          <p style="color: #999; margin-bottom: 32px;">Password Reset</p>
          <p>Hey ${userName},</p>
          <p>Someone requested a password reset for your account. Click below to set a new password:</p>
          <a href="${resetUrl}" style="display: inline-block; margin: 24px 0; padding: 14px 32px; background: #39FF14; color: #0A0A0F; font-weight: 600; text-decoration: none; border-radius: 8px;">Reset Password</a>
          <p style="color: #666; font-size: 14px;">This link expires in 1 hour. If you didn't request this, ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #222; margin: 32px 0;" />
          <p style="color: #555; font-size: 12px;">Sprint Society by Kendu Entertainment</p>
        </div>
      `,
    }, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    return true;
  } catch (err: any) {
    console.error('[Email] Failed to send:', err.response?.data || err.message);
    return false;
  }
}
