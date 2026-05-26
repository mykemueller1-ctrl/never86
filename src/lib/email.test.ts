import { describe, it, expect, vi, beforeEach } from 'vitest';

const { sendMock } = vi.hoisted(() => ({ sendMock: vi.fn() }));

vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({ emails: { send: sendMock } })),
}));

import { sendWelcomeEmail, sendMorningBriefing, sendNotification } from './email';

beforeEach(() => {
  sendMock.mockReset();
  sendMock.mockResolvedValue({ id: 'email-1' });
});

describe('sendWelcomeEmail', () => {
  it('greets by first name when a full name is given', async () => {
    await sendWelcomeEmail('chef@example.com', 'Ann Marie Chef');
    const payload = sendMock.mock.calls[0][0];
    expect(payload.to).toBe('chef@example.com');
    expect(payload.subject).toMatch(/on the list/i);
    expect(payload.html).toContain('Hey Ann,');
  });

  it('falls back to "there" when no name is given', async () => {
    await sendWelcomeEmail('chef@example.com');
    expect(sendMock.mock.calls[0][0].html).toContain('Hey there,');
  });
});

describe('sendNotification', () => {
  it('passes the subject through and embeds the message in the HTML', async () => {
    await sendNotification('owner@example.com', 'New signup', '<b>Someone</b> joined');
    const payload = sendMock.mock.calls[0][0];
    expect(payload.to).toBe('owner@example.com');
    expect(payload.subject).toBe('New signup');
    expect(payload.html).toContain('<b>Someone</b> joined');
  });
});

describe('sendMorningBriefing', () => {
  it('sends the provided HTML verbatim with a dated subject', async () => {
    const html = '<html><body>numbers</body></html>';
    await sendMorningBriefing('owner@example.com', html);
    const payload = sendMock.mock.calls[0][0];
    expect(payload.html).toBe(html);
    expect(payload.subject).toMatch(/Morning Briefing/);
  });
});
