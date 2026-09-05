import { escapeHtml } from './escapeHtml';

/** Void Hunter blue. Magic-link mail and owner-desk first paint use this only. */
export const VOID_HUNTER_BLUE = '#0066ff';

/**
 * Shared client/server minimum for a self-service free-seat password.
 * Import this everywhere a password length is validated or displayed so the
 * client form and `setFreeSeatPassword` never drift out of sync.
 */
export const MIN_FREE_SEAT_PASSWORD_LEN = 8;

/** Signed-in owner first paint — SimpleOwnerDemo chat, not the card picker. */
export const OWNER_DESK_PATH = '/operator' as const;

export const OWNER_DESK_POST_AUTH_REDIRECT = OWNER_DESK_PATH;

export const OWNER_DESK_EMAIL_SUBJECT = 'Open your owner desk.';
export const OWNER_DESK_EMAIL_CTA = 'Open owner desk';
export const OWNER_DESK_EMAIL_KICKER = "Never 86'd · Owner desk";
export const OWNER_DESK_EMAIL_HEADLINE = 'Open your owner desk.';
export const OWNER_DESK_EMAIL_BODY =
  "Your free owner seat is ready. Ask what's going on in your restaurant — talk, type, photo, or file. Seat 1 stays free. No password. No sales call.";

const FORBIDDEN_EMAIL_COLORS = [
  '#d4a017',
  '#eab308',
  '#f59e0b',
  '#ff9500',
  '#e66b27',
  '#c4a35a',
  'gold',
  'amber',
  '#111',
  '#111111',
  '#f7f4ec',
  '#fffdf8',
  '#ebe6d8',
] as const;

export function buildOwnerDeskActivationLink(baseUrl: string, rawToken: string): string {
  const base = baseUrl.replace(/\/$/, '') || 'https://www.never86.ai';
  return `${base}/activate?token=${encodeURIComponent(rawToken)}`;
}

export function activationEmailHtml(link: string, expiresAt: Date): string {
  const safeLink = escapeHtml(link);
  const safeExpires = escapeHtml(expiresAt.toUTCString());
  return `
<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:system-ui,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 24px;">
    <p style="color:${VOID_HUNTER_BLUE};font-size:12px;letter-spacing:0.12em;text-transform:uppercase;font-weight:600;">${OWNER_DESK_EMAIL_KICKER}</p>
    <h1 style="color:${VOID_HUNTER_BLUE};font-size:28px;margin:12px 0;">${OWNER_DESK_EMAIL_HEADLINE}</h1>
    <p style="color:#0f172a;font-size:16px;line-height:1.6;">
      ${OWNER_DESK_EMAIL_BODY}
    </p>
    <p style="margin:28px 0;">
      <a href="${safeLink}" style="background:${VOID_HUNTER_BLUE};color:#ffffff;text-decoration:none;padding:14px 22px;border-radius:999px;font-weight:600;">
        ${OWNER_DESK_EMAIL_CTA}
      </a>
    </p>
    <p style="color:#4b5563;font-size:13px;line-height:1.5;">
      Link expires ${safeExpires}. If you didn’t ask for this, ignore it.
    </p>
  </div>
</body></html>`;
}

export function activationEmailLooksCheap(html: string): boolean {
  const lower = html.toLowerCase();
  return FORBIDDEN_EMAIL_COLORS.some((token) => {
    const needle = token.toLowerCase();
    if (needle.startsWith('#') && needle.length <= 4) {
      return new RegExp(`${needle}(?![0-9a-f])`, 'i').test(lower);
    }
    return lower.includes(needle);
  });
}

export function activationEmailPayload(to: string, link: string, expiresAt: Date): {
  from: string;
  to: string;
  subject: string;
  html: string;
} {
  return {
    from: "Never 86'd <hello@never86.ai>",
    to,
    subject: OWNER_DESK_EMAIL_SUBJECT,
    html: activationEmailHtml(link, expiresAt),
  };
}
