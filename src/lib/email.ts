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

// Plain-text, operator-voice follow-up. No graphic chrome. Like a real
// founder emailing personally. agentName is optional — when set, the
// subject line pulls the agent context the lead unlocked from.
export async function sendFollowupEmail(opts: {
  to: string;
  firstName?: string;
  agentName?: string;
  kind: '24h' | '7d';
}) {
  const first = opts.firstName?.split(' ')[0] || 'there';
  const agent = opts.agentName || null;

  const subject24 = agent
    ? `re: ${agent}`
    : `re: never86`;
  const subject7 = agent
    ? `One question on ${agent}`
    : 'One question';

  const body24 = agent
    ? `${first},\n\nQuick check — were you able to look at ${agent}? If not, no rush. If yes, the question I always have is: did it surface anything that surprised you?\n\nIf you want to see it on one of your own stores, drop me a note. 15 minutes, no setup, I'll bring the math.\n\n— Myke`
    : `${first},\n\nQuick check — were you able to look at the demo? Either way, no rush.\n\nIf you want to see it on one of your own stores, drop me a note. 15 minutes, no setup.\n\n— Myke`;

  const body7 = agent
    ? `${first},\n\nOne question: at your size, what's the part of ${agent} that doesn't match how you actually run? I want to fix it before you spend any time on us.\n\nReply with one line, or if it's easier — never86.ai/operators#talk\n\n— Myke`
    : `${first},\n\nOne question: what's the leak you'd want named first if we ran this on your numbers?\n\nReply with one line, or if it's easier — never86.ai/operators#talk\n\n— Myke`;

  const subject = opts.kind === '24h' ? subject24 : subject7;
  const text = opts.kind === '24h' ? body24 : body7;

  return resend.emails.send({
    from: "Myke Mueller <myke@n86.app>",
    to: opts.to,
    subject,
    text,
    reply_to: 'myke@n86.app',
  });
}
