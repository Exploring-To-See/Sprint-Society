import axios from 'axios';
import { config } from '../config';

// Email delivery via Resend (https://resend.com). The API key comes ONLY from the
// environment (RESEND_API_KEY — set in Vercel); no key is ever hardcoded.
//
// Deliverability (stay out of spam):
//  - Send from a VERIFIED custom domain via EMAIL_FROM (e.g. "Sprint Society
//    <noreply@yourdomain.com>"). Sending from Resend's shared onboarding@resend.dev
//    (the dev-only fallback below) or an unverified domain lands in spam.
//  - Every email is multipart (HTML + plaintext) — a big inbox-placement factor.
//  - A real Reply-To (EMAIL_REPLY_TO), branded consistent From, and a
//    List-Unsubscribe header on bulk (notification) emails.
//  - Domain DNS must publish SPF, DKIM and DMARC (Resend shows the records on the
//    domain page) so receivers can authenticate the mail.

const RESEND_ENDPOINT = 'https://api.resend.com/emails';
const DEV_FALLBACK_FROM = 'Sprint Society <onboarding@resend.dev>'; // local dev ONLY

function sender(): string {
  return process.env.EMAIL_FROM || DEV_FALLBACK_FROM;
}
function replyToAddress(): string | undefined {
  return process.env.EMAIL_REPLY_TO || undefined;
}

interface SendParams {
  to: string;
  subject: string;
  html: string;
  text: string;
  headers?: Record<string, string>;
}

/** Low-level send. Returns true on success; degrades gracefully (logs) if the
 *  key is missing so flows never crash in dev / before env is set. */
async function send({ to, subject, html, text, headers }: SendParams): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(`[Email] RESEND_API_KEY not set — skipped "${subject}" to ${to}`);
    return false;
  }
  try {
    const payload: Record<string, unknown> = { from: sender(), to, subject, html, text };
    const rt = replyToAddress();
    if (rt) payload.reply_to = rt;
    if (headers) payload.headers = headers;

    await axios.post(RESEND_ENDPOINT, payload, {
      headers: { Authorization: `Bearer ${apiKey}` },
      timeout: 10000,
    });
    return true;
  } catch (err: any) {
    console.error('[Email] send failed:', err?.response?.data || err?.message);
    return false;
  }
}

// --------------------------------------------------------------------------- //
// Templates — simple, high text-to-markup ratio, no spammy words / image-only
// bodies. A branded wrapper + a matching plaintext part for every message.
// --------------------------------------------------------------------------- //
function layout(heading: string, bodyHtml: string, footerExtraHtml = ''): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/></head>
  <body style="margin:0;background:#0A0A0F;">
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:480px;margin:0 auto;padding:40px 24px;background:#0A0A0F;color:#ffffff;">
      <div style="font-size:20px;font-weight:700;margin-bottom:4px;">Sprint Society</div>
      <div style="color:#8a8a94;font-size:13px;margin-bottom:28px;">${heading}</div>
      ${bodyHtml}
      <hr style="border:none;border-top:1px solid #222;margin:32px 0;" />
      <div style="color:#5a5a63;font-size:12px;line-height:1.6;">Sprint Society by Kendu Entertainment.${footerExtraHtml}</div>
    </div>
  </body></html>`;
}

function button(label: string, url: string): string {
  return `<a href="${url}" style="display:inline-block;margin:24px 0;padding:14px 32px;background:#39FF14;color:#0A0A0F;font-weight:600;text-decoration:none;border-radius:8px;">${label}</a>`;
}

// --------------------------------------------------------------------------- //
// Password reset (transactional)
// --------------------------------------------------------------------------- //
export async function sendPasswordResetEmail(to: string, resetUrl: string, userName: string): Promise<boolean> {
  const name = userName || 'there';
  const html = layout('Password reset', `
    <p style="font-size:15px;line-height:1.6;color:#eaeaf0;">Hi ${name},</p>
    <p style="font-size:15px;line-height:1.6;color:#c8c8d0;">We received a request to reset your password. Choose a new one using the button below. This link expires in 1 hour.</p>
    ${button('Reset password', resetUrl)}
    <p style="color:#8a8a94;font-size:13px;">If you didn't request this, you can ignore this email — your password won't change.</p>
    <p style="color:#5a5a63;font-size:12px;word-break:break-all;">Or open this link: ${resetUrl}</p>
  `);
  const text = `Hi ${name},

We received a request to reset your Sprint Society password. Open this link to choose a new one (it expires in 1 hour):

${resetUrl}

If you didn't request this, ignore this email.

— Sprint Society`;
  return send({ to, subject: 'Reset your Sprint Society password', html, text });
}

// --------------------------------------------------------------------------- //
// One-time passcode (transactional) — verification / passwordless login
// --------------------------------------------------------------------------- //
export async function sendOtpEmail(to: string, code: string, userName?: string): Promise<boolean> {
  const greeting = userName ? `Hi ${userName},` : 'Hi,';
  const html = layout('Verification code', `
    <p style="font-size:15px;line-height:1.6;color:#eaeaf0;">${greeting}</p>
    <p style="font-size:15px;line-height:1.6;color:#c8c8d0;">Use this code to verify it's you:</p>
    <div style="font-size:32px;font-weight:700;letter-spacing:8px;margin:20px 0;color:#39FF14;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;">${code}</div>
    <p style="color:#8a8a94;font-size:13px;">This code expires in 10 minutes. Never share it with anyone.</p>
  `);
  const text = `${greeting}

Your Sprint Society verification code is: ${code}

It expires in 10 minutes. Never share it with anyone.

— Sprint Society`;
  return send({ to, subject: `${code} is your Sprint Society code`, html, text });
}

// --------------------------------------------------------------------------- //
// Notification email (bulk) — includes List-Unsubscribe for deliverability
// --------------------------------------------------------------------------- //
export interface NotificationEmailOpts {
  subject: string;
  heading: string;
  title: string;
  body?: string;
  ctaText?: string;
  ctaUrl?: string;
}

export async function sendNotificationEmail(to: string, userName: string, o: NotificationEmailOpts): Promise<boolean> {
  const name = userName || 'Runner';
  const manageUrl = `${config.clientUrl}/notifications`;
  const cta = o.ctaText && o.ctaUrl ? button(o.ctaText, o.ctaUrl) : '';
  const html = layout(o.heading, `
    <p style="font-size:15px;line-height:1.6;color:#eaeaf0;">Hi ${name},</p>
    <p style="font-size:16px;font-weight:600;line-height:1.5;margin:8px 0;color:#ffffff;">${o.title}</p>
    ${o.body ? `<p style="color:#c8c8d0;font-size:15px;line-height:1.6;">${o.body}</p>` : ''}
    ${cta}
  `, ` <a href="${manageUrl}" style="color:#7a7a83;text-decoration:underline;">Manage email notifications</a>.`);
  const text = `Hi ${name},

${o.title}${o.body ? `\n${o.body}` : ''}${o.ctaUrl ? `\n\n${o.ctaText || 'Open'}: ${o.ctaUrl}` : ''}

— Sprint Society
Manage email notifications: ${manageUrl}`;

  // List-Unsubscribe: a URL (settings) plus a mailto when a reply-to is set.
  // (For high-volume bulk sending, add a one-click POST endpoint + the
  //  List-Unsubscribe-Post header per Gmail/Yahoo 2024 rules.)
  const rt = replyToAddress();
  const listUnsub = rt ? `<${manageUrl}>, <mailto:${rt}?subject=unsubscribe>` : `<${manageUrl}>`;
  return send({ to, subject: o.subject, html, text, headers: { 'List-Unsubscribe': listUnsub } });
}

// --------------------------------------------------------------------------- //
// Production diagnostics — send a real test email and surface the exact Resend
// result/error (unverified domain, invalid key, bad recipient, ...). Used by the
// admin email-test endpoint to confirm production delivery in one call.
// --------------------------------------------------------------------------- //
export interface EmailDiagnostic {
  configured: boolean;          // RESEND_API_KEY present in this runtime
  from: string;                 // the sender actually in use (EMAIL_FROM)
  replyTo: string | null;
  usingFallbackSender: boolean; // true => still onboarding@resend.dev (misconfigured)
  sent: boolean;
  providerId?: string;          // Resend message id on success
  error?: string;               // the exact provider/transport error on failure
}

export async function sendEmailDiagnostic(to: string): Promise<EmailDiagnostic> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = sender();
  const base: EmailDiagnostic = {
    configured: !!apiKey,
    from,
    replyTo: replyToAddress() ?? null,
    usingFallbackSender: from === DEV_FALLBACK_FROM,
    sent: false,
  };
  if (!apiKey) return { ...base, error: 'RESEND_API_KEY is not set in this environment' };

  try {
    const payload: Record<string, unknown> = {
      from,
      to,
      subject: 'Sprint Society — email delivery test',
      html: layout('Delivery test', `<p style="font-size:15px;line-height:1.6;color:#c8c8d0;">This confirms your Sprint Society email delivery is configured and working. If it landed in your inbox (not spam), you're all set.</p>`),
      text: "This confirms your Sprint Society email delivery is configured and working.\n\n— Sprint Society",
    };
    const rt = replyToAddress();
    if (rt) payload.reply_to = rt;

    const res = await axios.post(RESEND_ENDPOINT, payload, {
      headers: { Authorization: `Bearer ${apiKey}` },
      timeout: 10000,
    });
    return { ...base, sent: true, providerId: res.data?.id };
  } catch (err: any) {
    const data = err?.response?.data;
    const detail = data?.message || data?.name || data?.error || err?.message || 'unknown error';
    return { ...base, error: String(detail) };
  }
}
