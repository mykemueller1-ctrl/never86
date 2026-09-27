import { escapeHtml } from './escapeHtml';

/** Void Hunter blue. Owner-desk first paint uses this. */
export const VOID_HUNTER_BLUE = '#0066ff';

/** Never86 brand blue for the set-password email and the sign-in / activate pages. */
export const EMAIL_BRAND_BLUE = '#285be8';

/**
 * Shared client/server minimum for a self-service person password.
 * Import this everywhere a password length is validated so the form and
 * setters never drift.
 */
export const MIN_FREE_SEAT_PASSWORD_LEN = 8;

/** Upper bound so an oversized password cannot burn CPU in scrypt (DoS). */
export const MAX_FREE_SEAT_PASSWORD_LEN = 128;

/** Signed-in owner first paint — SimpleOwnerDemo chat, not the card picker. */
export const OWNER_DESK_PATH = '/operator' as const;

export const OWNER_DESK_POST_AUTH_REDIRECT = OWNER_DESK_PATH;

export const OWNER_DESK_EMAIL_SUBJECT = 'Set your password once.';
export const OWNER_DESK_EMAIL_CTA = 'Set your password';
export const OWNER_DESK_EMAIL_KICKER = "Never 86'd · Owner desk";
export const OWNER_DESK_EMAIL_HEADLINE = 'Set your password';
export const OWNER_DESK_EMAIL_BODY =
  'Choose a password to finish setting up your account. You’ll sign in with this email and that password.';

const EMAIL_FONT_STACK =
  "Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

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
  const font = EMAIL_FONT_STACK;
  const blue = EMAIL_BRAND_BLUE;
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${OWNER_DESK_EMAIL_SUBJECT}</title>
</head>
<body style="margin:0;padding:0;background:#f4f5f7;-webkit-text-size-adjust:100%;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">Choose a password to finish setting up your Never86 account.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f5f7;">
  <tr>
    <td align="center" style="padding:40px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:480px;">
        <tr>
          <td align="left" style="padding:0 4px 20px 4px;font-family:${font};font-size:20px;line-height:24px;font-weight:700;letter-spacing:-0.02em;color:#0f172a;">
            Never<span style="color:${blue};">86</span>
          </td>
        </tr>
        <tr>
          <td style="background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;padding:36px 32px;font-family:${font};">
            <h1 style="margin:0 0 12px 0;font-family:${font};font-size:24px;line-height:32px;font-weight:700;color:#0f172a;">${OWNER_DESK_EMAIL_HEADLINE}</h1>
            <p style="margin:0 0 28px 0;font-family:${font};font-size:16px;line-height:24px;color:#475569;">${OWNER_DESK_EMAIL_BODY}</p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td align="center" bgcolor="${blue}" style="background:${blue};border-radius:8px;">
                  <a href="${safeLink}" target="_blank" style="display:block;padding:15px 24px;font-family:${font};font-size:16px;line-height:20px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">${OWNER_DESK_EMAIL_CTA}</a>
                </td>
              </tr>
            </table>
            <p style="margin:28px 0 6px 0;font-family:${font};font-size:13px;line-height:20px;color:#64748b;">Button not working? Copy and paste this link into your browser:</p>
            <p style="margin:0 0 24px 0;font-family:${font};font-size:13px;line-height:20px;word-break:break-all;"><a href="${safeLink}" target="_blank" style="color:${blue};text-decoration:underline;">${safeLink}</a></p>
            <p style="margin:0;padding-top:20px;border-top:1px solid #e5e7eb;font-family:${font};font-size:13px;line-height:20px;color:#64748b;">This link expires ${safeExpires}. If you didn’t ask for it, you can ignore this email.</p>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:20px 4px 0 4px;font-family:${font};font-size:12px;line-height:18px;color:#94a3b8;">
            Never86 · <a href="https://www.never86.ai" target="_blank" style="color:#94a3b8;text-decoration:underline;">never86.ai</a>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

export function activationEmailText(link: string, expiresAt: Date): string {
  return [
    `${OWNER_DESK_EMAIL_HEADLINE}`,
    '',
    OWNER_DESK_EMAIL_BODY,
    '',
    `${OWNER_DESK_EMAIL_CTA}: ${link}`,
    '',
    `This link expires ${expiresAt.toUTCString()}. If you didn’t ask for it, you can ignore this email.`,
    '',
    '— Never86 · https://www.never86.ai',
  ].join('\n');
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
  text: string;
} {
  return {
    from: "Never 86'd <hello@never86.ai>",
    to,
    subject: OWNER_DESK_EMAIL_SUBJECT,
    html: activationEmailHtml(link, expiresAt),
    text: activationEmailText(link, expiresAt),
  };
}
