import { Resend } from 'resend';

let resendClient: Resend | undefined;

function getResend() {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY is not set');
    }
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

export async function sendWelcomeEmail(email: string, name?: string) {
  const firstName = name?.split(' ')[0] || 'there';

  return getResend().emails.send({
    from: 'Never 86\'d <hello@never86.ai>',
    to: email,
    subject: 'Your free owner seat is reserved — Never 86\'d',
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#121212;font-family:system-ui,-apple-system,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 24px;">
    <h1 style="color:#d4a017;font-size:28px;margin:0 0 24px;">Never 86'd</h1>
    <p style="color:#ffffff;font-size:16px;line-height:1.6;">
      Hey ${firstName},
    </p>
    <p style="color:#ffffff;font-size:16px;line-height:1.6;">
      Your free owner seat is reserved. We built Never 86'd for hospitality owners first —
      not for another bloated stack or another dashboard nobody trusts.
    </p>
    <p style="color:#ffffff;font-size:16px;line-height:1.6;">
      One location plus seat 1 is free, and seat 1 is the owner seat. When you add seat 2,
      seat 3, or more people later, those become paid seats.
    </p>
    <p style="color:#ffffff;font-size:16px;line-height:1.6;">
      Never 86'd reads invoices, normalizes Z/POS and 3P proof, and sends the owner the one
      action that matters before the shift starts.
    </p>
    <p style="color:#b0b0b0;font-size:14px;line-height:1.6;margin-top:32px;">
      We'll reach out with next steps for your owner seat.<br/>
      — Myke, founder of Never 86'd
    </p>
    <div style="border-top:1px solid #303030;margin-top:40px;padding-top:16px;">
      <p style="color:#505050;font-size:12px;">
        Never 86'd · Built by an operator, for operators
      </p>
    </div>
  </div>
</body>
</html>`,
  });
}

export async function sendMorningBriefing(email: string, htmlContent: string) {
  return getResend().emails.send({
    from: 'Never 86\'d <briefing@never86.ai>',
    to: email,
    subject: `Your Morning Briefing — ${new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}`,
    html: htmlContent,
  });
}

export async function sendNotification(email: string, subject: string, message: string) {
  return getResend().emails.send({
    from: 'Never 86\'d <alerts@never86.ai>',
    to: email,
    subject,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#121212;font-family:system-ui,-apple-system,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 24px;">
    <h1 style="color:#d4a017;font-size:24px;margin:0 0 16px;">Never 86'd</h1>
    <p style="color:#ffffff;font-size:16px;line-height:1.6;">${message}</p>
  </div>
</body>
</html>`,
  });
}
