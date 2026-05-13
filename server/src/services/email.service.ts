let resendClient: any = null;

async function getResend() {
  if (!process.env.RESEND_API_KEY) return null;
  if (!resendClient) {
    const { Resend } = await import('resend');
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

export async function sendPasswordResetEmail(to: string, resetUrl: string, userName: string): Promise<boolean> {
  const resend = await getResend();

  if (!resend) {
    console.warn('[Email] RESEND_API_KEY not set — logging reset link instead');
    console.log(`[Email] Password reset for ${to}: ${resetUrl}`);
    return true;
  }

  try {
    const { error } = await resend.emails.send({
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
    });

    if (error) {
      console.error('[Email] Failed to send:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[Email] Error:', err);
    return false;
  }
}
