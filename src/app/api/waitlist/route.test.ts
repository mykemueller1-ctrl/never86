import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createDbMock, makeJsonRequest } from '@/test/db-mock';
import { waitlist } from '@/db/schema';

const { dbHolder } = vi.hoisted(() => ({ dbHolder: { current: null as any } }));
vi.mock('@/db', () => ({
  db: new Proxy({}, { get: (_t, prop: string) => dbHolder.current?.[prop] }),
}));

const { emailMocks } = vi.hoisted(() => ({
  emailMocks: { sendWelcomeEmail: vi.fn(), sendNotification: vi.fn() },
}));
vi.mock('@/lib/email', () => emailMocks);

import { POST } from './route';

beforeEach(() => {
  emailMocks.sendWelcomeEmail.mockResolvedValue({ id: 'e1' });
  emailMocks.sendNotification.mockResolvedValue({ id: 'e2' });
});

describe('POST /api/waitlist', () => {
  it('adds a new signup, sends the welcome email, and notifies the owner', async () => {
    dbHolder.current = createDbMock(new Map([[waitlist, [{ id: 1, email: 'new@example.com' }]]]));

    const res = await POST(makeJsonRequest({ email: 'new@example.com', name: 'New Owner' }));
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(data.message).toMatch(/on the list/i);
    expect(emailMocks.sendWelcomeEmail).toHaveBeenCalledWith('new@example.com', 'New Owner');
    expect(emailMocks.sendNotification).toHaveBeenCalledOnce();
  });

  it('is idempotent for a duplicate email and skips the welcome email', async () => {
    // onConflictDoNothing returns no row.
    dbHolder.current = createDbMock(new Map([[waitlist, []]]));

    const res = await POST(makeJsonRequest({ email: 'dupe@example.com' }));
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(data.message).toMatch(/already on the list/i);
    expect(emailMocks.sendWelcomeEmail).not.toHaveBeenCalled();
  });

  it('returns 400 for an invalid email', async () => {
    dbHolder.current = createDbMock();

    const res = await POST(makeJsonRequest({ email: 'nope' }));

    expect(res.status).toBe(400);
    expect(emailMocks.sendWelcomeEmail).not.toHaveBeenCalled();
  });
});
