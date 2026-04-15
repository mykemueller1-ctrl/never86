import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendWelcomeEmail(email: string, name?: string) {
  const firstName = name?.split(' ')[0] || 'there';

  return resend.emails.send({
    from: 'Never 86\'d <hello@never86.ai>',
    to: email,
    subject: 'You\'re on the list — Never 86\'d is coming',
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
      You're in. We're building the ops platform that independent restaurant owners actually need —
      not another tool that makes your tech stack worse.
    </p>
    <p style="color:#ffffff;font-size:16px;line-height:1.6;">
      Never 86'd reads your invoices, processes your Z-reports, and sends you a morning briefing
      with your real numbers — food cost, prime cost, check average — before you even walk in the door.
    </p>
    <p style="color:#ffffff;font-size:16px;line-height:1.6;">
      No spreadsheets. No manual data entry. No counting inventory on your day off.
    </p>
    <p style="color:#b0b0b0;font-size:14px;line-height:1.6;margin-top:32px;">
      We'll reach out when your spot is ready.<br/>
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
  return resend.emails.send({
    from: 'Never 86\'d <briefing@never86.ai>',
    to: email,
    subject: `Your Morning Briefing — ${new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}`,
    html: htmlContent,
  });
}

export async function sendNotification(email: string, subject: string, message: string) {
  return resend.emails.send({
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
