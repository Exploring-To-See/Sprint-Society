// Central contact + legal metadata. TODO(legal): confirm the real support address,
// legal entity name, and jurisdiction before launch — these strings appear in the
// Privacy Policy, Terms, cookie banner, and the in-app feedback/support surfaces.
export const SUPPORT_EMAIL = 'support@sprintsociety.app'; // TODO: set production inbox
export const LEGAL_ENTITY = 'Kendu Entertainment'; // TODO: confirm registered entity
export const GOVERNING_LAW = 'India';
export const LEGAL_LAST_UPDATED = 'July 2026'; // bump when policy text changes

export const supportMailto = (subject = '', body = '') =>
  `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}${body ? `&body=${encodeURIComponent(body)}` : ''}`;
