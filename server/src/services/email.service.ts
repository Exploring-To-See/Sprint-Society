import axios from 'axios';
import nodemailer, { type Transporter } from 'nodemailer';
import { config } from '../config';

// Email delivery with a provider switch (set EMAIL_PROVIDER in Vercel):
//   EMAIL_PROVIDER=gmail   -> Gmail SMTP (nodemailer). Interim primary.
//   EMAIL_PROVIDER=resend  -> Resend HTTP API (default). Switch back with one env var.
//
// No secrets are ever hardcoded — keys/passwords come only from the environment.
//
// Deliverability notes:
//   * Gmail SMTP: the From address MUST be your Gmail (GMAIL_USER). Sending "from"
//     another domain via Gmail fails SPF/DKIM alignment and lands in spam, so we
//     always send as "<EMAIL_FROM_NAME> <GMAIL_USER>". Gmail caps ~500/day (free)
//     / ~2000/day (Workspace) and needs a 2FA App Password (not the login password).
//   * Resend: send from a VERIFIED custom domain via EMAIL_FROM; publish SPF/DKIM/
//     DMARC. onboarding@resend.dev (the dev fallback) only reaches your own address.
//   * Every email is multipart (HTML + plaintext) with a Reply-To, and notification
//     emails carry List-Unsubscribe — all inbox-placement factors.

const RESEND_ENDPOINT = 'https://api.resend.com/emails';
const DEV_FALLBACK_FROM = 'Sprint Society <onboarding@resend.dev>';

type Provider = 'gmail' | 'resend';
function activeProvider(): Provider {
  return (process.env.EMAIL_PROVIDER || 'resend').trim().toLowerCase() === 'gmail' ? 'gmail' : 'resend';
}

function gmailFrom(): string {
  const name = process.env.EMAIL_FROM_NAME || 'Sprint Society';
  return `${name} <${process.env.GMAIL_USER || ''}>`;
}
function resendFrom(): string {
  return process.env.EMAIL_FROM || DEV_FALLBACK_FROM;
}
function activeFrom(): string {
  return activeProvider() === 'gmail' ? gmailFrom() : resendFrom();
}
function replyToAddress(): string | undefined {
  return process.env.EMAIL_REPLY_TO || undefined;
}
function credentialsPresent(): boolean {
  return activeProvider() === 'gmail'
    ? !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD)
    : !!process.env.RESEND_API_KEY;
}

// Gmail SMTP transporter, cached per warm serverless instance.
let gmailTransporter: Transporter | null = null;
function getGmailTransporter(): Transporter | null {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) return null;
  if (!gmailTransporter) {
    gmailTransporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user, pass },
    });
  }
  return gmailTransporter;
}

interface SendParams {
  to: string;
  subject: string;
  html: string;
  text: string;
  headers?: Record<string, string>;
}
interface SendResult {
  ok: boolean;
  id?: string;
  error?: string;
}

async function sendViaResend(p: SendParams): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { ok: false, error: 'RESEND_API_KEY is not set' };
  try {
    const payload: Record<string, unknown> = { from: resendFrom(), to: p.to, subject: p.subject, html: p.html, text: p.text };
    const rt = replyToAddress();
    if (rt) payload.reply_to = rt;
    if (p.headers) payload.headers = p.headers;
    const res = await axios.post(RESEND_ENDPOINT, payload, {
      headers: { Authorization: `Bearer ${apiKey}` },
      timeout: 10000,
    });
    return { ok: true, id: res.data?.id };
  } catch (err: any) {
    const data = err?.response?.data;
    return { ok: false, error: String(data?.message || data?.name || data?.error || err?.message || 'unknown error') };
  }
}

async function sendViaGmail(p: SendParams): Promise<SendResult> {
  const t = getGmailTransporter();
  if (!t) return { ok: false, error: 'GMAIL_USER / GMAIL_APP_PASSWORD not set' };
  try {
    const info = await t.sendMail({
      from: gmailFrom(),
      to: p.to,
      subject: p.subject,
      html: p.html,
      text: p.text,
      replyTo: replyToAddress(),
      headers: p.headers,
    });
    return { ok: true, id: info.messageId };
  } catch (err: any) {
    return { ok: false, error: String(err?.message || 'unknown error') };
  }
}

async function dispatch(p: SendParams): Promise<SendResult> {
  return activeProvider() === 'gmail' ? sendViaGmail(p) : sendViaResend(p);
}

/** Send an email via the active provider. Returns true on success; degrades
 *  gracefully (logs) so flows never crash if credentials are missing. */
async function send(p: SendParams): Promise<boolean> {
  if (!credentialsPresent()) {
    console.warn(`[Email] ${activeProvider()} credentials not set — skipped "${p.subject}" to ${p.to}`);
    return false;
  }
  const r = await dispatch(p);
  if (!r.ok) console.error(`[Email] ${activeProvider()} send failed:`, r.error);
  return r.ok;
}

// --------------------------------------------------------------------------- //
// Templates — simple, high text-to-markup ratio, plaintext + HTML for every mail
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

// Password reset (transactional)
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

// One-time passcode (transactional)
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

// Notification email (bulk) — includes List-Unsubscribe
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

  const rt = replyToAddress();
  const listUnsub = rt ? `<${manageUrl}>, <mailto:${rt}?subject=unsubscribe>` : `<${manageUrl}>`;
  return send({ to, subject: o.subject, html, text, headers: { 'List-Unsubscribe': listUnsub } });
}

// Password changed (transactional security notice)
export async function sendPasswordChangedEmail(to: string, userName: string): Promise<boolean> {
  const name = userName || 'there';
  const html = layout('Security', `
    <p style="font-size:15px;line-height:1.6;color:#eaeaf0;">Hi ${name},</p>
    <p style="font-size:15px;line-height:1.6;color:#c8c8d0;">Your Sprint Society password was just changed. If this was you, no action is needed.</p>
    <p style="color:#8a8a94;font-size:13px;">If you did <strong>not</strong> change it, reset your password now and secure your account.</p>
    ${button('Reset password', `${config.clientUrl}/forgot-password`)}
  `);
  const text = `Hi ${name},

Your Sprint Society password was just changed. If this was you, no action is needed.

If you did NOT change it, reset your password now: ${config.clientUrl}/forgot-password

— Sprint Society`;
  return send({ to, subject: 'Your Sprint Society password was changed', html, text });
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Custom admin email — a free-text message wrapped in the branded template.
export async function sendCustomEmail(
  to: string, subject: string, message: string, userName?: string
): Promise<{ ok: boolean; error?: string; provider: Provider; providerId?: string }> {
  const provider = activeProvider();
  if (!credentialsPresent()) {
    return { ok: false, provider, error: `${provider} credentials are not set` };
  }
  const greeting = userName ? `<p style="font-size:15px;line-height:1.6;color:#eaeaf0;">Hi ${userName},</p>` : '';
  const bodyHtml = escapeHtml(message).replace(/\n/g, '<br/>');
  const html = layout(subject, `${greeting}<p style="font-size:15px;line-height:1.7;color:#c8c8d0;">${bodyHtml}</p>`);
  const text = `${userName ? `Hi ${userName},\n\n` : ''}${message}\n\n— Sprint Society`;
  const r = await dispatch({ to, subject, html, text });
  return { ok: r.ok, error: r.error, providerId: r.id, provider };
}

// --------------------------------------------------------------------------- //
// Production diagnostics — send a real test email via the ACTIVE provider and
// surface the exact result/error. Used by the admin email-test endpoint.
// --------------------------------------------------------------------------- //
export interface EmailDiagnostic {
  provider: Provider;
  configured: boolean;          // credentials present for the active provider
  from: string;                 // sender actually in use
  replyTo: string | null;
  usingFallbackSender: boolean; // resend only: still onboarding@resend.dev
  sent: boolean;
  providerId?: string;
  error?: string;
}

export async function sendEmailDiagnostic(to: string): Promise<EmailDiagnostic> {
  const provider = activeProvider();
  const from = activeFrom();
  const base: EmailDiagnostic = {
    provider,
    configured: credentialsPresent(),
    from,
    replyTo: replyToAddress() ?? null,
    usingFallbackSender: provider === 'resend' && from === DEV_FALLBACK_FROM,
    sent: false,
  };
  if (!base.configured) {
    return { ...base, error: provider === 'gmail'
      ? 'GMAIL_USER / GMAIL_APP_PASSWORD not set in this environment'
      : 'RESEND_API_KEY is not set in this environment' };
  }
  const r = await dispatch({
    to,
    subject: 'Sprint Society — email delivery test',
    html: layout('Delivery test', `<p style="font-size:15px;line-height:1.6;color:#c8c8d0;">This confirms your Sprint Society email delivery is configured and working. If it landed in your inbox (not spam), you're all set.</p>`),
    text: "This confirms your Sprint Society email delivery is configured and working.\n\n— Sprint Society",
  });
  return { ...base, sent: r.ok, providerId: r.id, error: r.error };
}
