import axios from 'axios';
import nodemailer, { type Transporter } from 'nodemailer';
import { config } from '../config';

// Email delivery with a provider switch (set EMAIL_PROVIDER in Vercel):
//   EMAIL_PROVIDER=gmail   -> Gmail SMTP (nodemailer). Interim primary.
//   EMAIL_PROVIDER=resend  -> Resend HTTP API (default). Switch back with one env var.
//
// No secrets are ever hardcoded — keys/passwords come only from the environment.
//
// Deliverability: light, standard, table-based transactional template (dark themes
// trip spam filters), a hidden preheader, multipart HTML + plaintext, Reply-To, and
// List-Unsubscribe on bulk mail. Gmail sends as "<EMAIL_FROM_NAME> <GMAIL_USER>"
// (SPF/DKIM-safe). Links use config.appUrl (the MAIN app, never the admin host).

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
// Template — clean, LIGHT, table-based transactional design (inbox-friendly),
// with a hidden preheader and a matching plaintext part for every message.
// --------------------------------------------------------------------------- //
const para = (t: string) => `<p style="margin:0 0 14px;color:#1f2937;font-size:15px;line-height:1.6;">${t}</p>`;
const muted = (t: string) => `<p style="margin:0 0 8px;color:#6b7280;font-size:13px;line-height:1.6;">${t}</p>`;

function button(label: string, url: string): string {
  return `<a href="${url}" style="display:inline-block;margin:18px 0;padding:12px 28px;background:#111827;color:#ffffff;font-weight:600;font-size:15px;text-decoration:none;border-radius:8px;">${label}</a>`;
}

function layout(opts: { heading: string; preheader: string; bodyHtml: string; footerNote?: string }): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <meta name="color-scheme" content="light only"/><meta name="supported-color-schemes" content="light"/></head>
  <body style="margin:0;padding:0;background:#f4f5f7;-webkit-text-size-adjust:100%;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${opts.preheader}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:24px 12px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border:1px solid #e6e8eb;border-radius:12px;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
          <tr><td style="padding:28px 32px 6px;">
            <div style="font-size:18px;font-weight:700;color:#0b0b0f;">Sprint Society</div>
            <div style="font-size:13px;color:#6b7280;margin-top:2px;">${opts.heading}</div>
          </td></tr>
          <tr><td style="padding:14px 32px 26px;">${opts.bodyHtml}</td></tr>
          <tr><td style="padding:18px 32px;border-top:1px solid #eef0f2;color:#9aa0a6;font-size:12px;line-height:1.6;">
            Sprint Society by Kendu Entertainment.${opts.footerNote ? `<br/>${opts.footerNote}` : ''}
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body></html>`;
}

// Password reset (transactional)
export async function sendPasswordResetEmail(to: string, resetUrl: string, userName: string): Promise<boolean> {
  const name = userName || 'there';
  const html = layout({
    heading: 'Password reset',
    preheader: 'Reset your Sprint Society password — this link expires in 1 hour.',
    bodyHtml:
      para(`Hi ${name},`) +
      para('We received a request to reset your password. Click the button below to choose a new one. This link expires in 1 hour.') +
      button('Reset password', resetUrl) +
      muted("If you didn't request this, you can ignore this email — your password won't change.") +
      `<p style="margin:8px 0 0;color:#9aa0a6;font-size:12px;word-break:break-all;">Or open this link: ${resetUrl}</p>`,
  });
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
  const html = layout({
    heading: 'Verification code',
    preheader: `Your Sprint Society verification code is ${code}.`,
    bodyHtml:
      para(greeting) +
      para("Use this code to verify it's you:") +
      `<div style="font-size:30px;font-weight:700;letter-spacing:8px;margin:16px 0;color:#111827;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;">${code}</div>` +
      muted('This code expires in 10 minutes. Never share it with anyone.'),
  });
  const text = `${greeting}

Your Sprint Society verification code is: ${code}

It expires in 10 minutes. Never share it with anyone.

— Sprint Society`;
  return send({ to, subject: `${code} is your Sprint Society code`, html, text });
}

// Password changed (transactional security notice)
export async function sendPasswordChangedEmail(to: string, userName: string): Promise<boolean> {
  const name = userName || 'there';
  const forgotUrl = `${config.appUrl}/forgot-password`;
  const html = layout({
    heading: 'Security',
    preheader: 'Your Sprint Society password was just changed.',
    bodyHtml:
      para(`Hi ${name},`) +
      para('Your Sprint Society password was just changed. If this was you, no action is needed.') +
      muted('If you did <strong>not</strong> change it, reset your password now and secure your account.') +
      button('Reset password', forgotUrl),
  });
  const text = `Hi ${name},

Your Sprint Society password was just changed. If this was you, no action is needed.

If you did NOT change it, reset your password now: ${forgotUrl}

— Sprint Society`;
  return send({ to, subject: 'Your Sprint Society password was changed', html, text });
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
  const manageUrl = `${config.appUrl}/notifications`;
  const cta = o.ctaText && o.ctaUrl ? button(o.ctaText, o.ctaUrl) : '';
  const html = layout({
    heading: o.heading,
    preheader: o.title,
    bodyHtml:
      para(`Hi ${name},`) +
      `<p style="margin:0 0 12px;color:#0b0b0f;font-size:16px;font-weight:600;line-height:1.5;">${o.title}</p>` +
      (o.body ? para(o.body) : '') +
      cta,
    footerNote: `You're receiving this because you have a Sprint Society account. <a href="${manageUrl}" style="color:#6b7280;text-decoration:underline;">Manage email notifications</a>.`,
  });
  const text = `Hi ${name},

${o.title}${o.body ? `\n${o.body}` : ''}${o.ctaUrl ? `\n\n${o.ctaText || 'Open'}: ${o.ctaUrl}` : ''}

— Sprint Society
Manage email notifications: ${manageUrl}`;

  const rt = replyToAddress();
  const listUnsub = rt ? `<${manageUrl}>, <mailto:${rt}?subject=unsubscribe>` : `<${manageUrl}>`;
  return send({ to, subject: o.subject, html, text, headers: { 'List-Unsubscribe': listUnsub } });
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
  const bodyHtml =
    (userName ? para(`Hi ${userName},`) : '') +
    `<div style="color:#1f2937;font-size:15px;line-height:1.7;">${escapeHtml(message).replace(/\n/g, '<br/>')}</div>`;
  const html = layout({ heading: subject, preheader: message.slice(0, 120), bodyHtml });
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
  configured: boolean;
  from: string;
  replyTo: string | null;
  usingFallbackSender: boolean;
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
    html: layout({
      heading: 'Delivery test',
      preheader: 'Confirming your Sprint Society email delivery works.',
      bodyHtml: para('This confirms your Sprint Society email delivery is configured and working. If it landed in your inbox (not spam), you\'re all set.'),
    }),
    text: 'This confirms your Sprint Society email delivery is configured and working.\n\n— Sprint Society',
  });
  return { ...base, sent: r.ok, providerId: r.id, error: r.error };
}
