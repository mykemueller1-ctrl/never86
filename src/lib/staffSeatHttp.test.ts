import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import sitemap from '../app/sitemap';
import { metadata as staffLoginMetadata } from '../app/staff/login/page';
import { metadata as staffSeatsMetadata } from '../app/staff/seats/page';
import { metadata as staffDeskMetadata } from '../app/staff/desk/page';
import { GET as loginGet, POST as loginPost } from '../app/api/staff/login/route';
import { POST as invitePost } from '../app/api/staff/invite/route';
import { PRIVATE_INPUTS_BEFORE_REAL_CTAP_LOGIN } from './staffSeatAuth';

describe('staff credential HTTP plane', () => {
  it('refuses live staff login without issuing a session cookie', async () => {
    const res = await loginPost();
    const body = await res.json();
    expect(res.status).toBe(503);
    expect(res.headers.get('X-Robots-Tag')).toBe('noindex, nofollow');
    expect(body.success).toBe(false);
    expect(body.issuance).toBe('blocked');
    expect(body.mailSent).toBe(false);
    expect(body.ownerPlane).toBe('/login');
    expect(body.privateInputIds).toEqual(PRIVATE_INPUTS_BEFORE_REAL_CTAP_LOGIN.map((item) => item.id));
    expect(res.headers.get('set-cookie')).toBeNull();
  });

  it('refuses live invite, reset, and revoke without sending mail', async () => {
    const get = await loginGet();
    expect(get.status).toBe(503);

    for (const action of ['invite', 'reset', 'revoke'] as const) {
      const res = await invitePost(new NextRequest('http://localhost/api/staff/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, targetSeatId: 'seat-foreign' }),
      }));
      const body = await res.json();
      expect(res.status).toBe(403);
      expect(body.success).toBe(false);
      expect(body.mailSent).toBe(false);
      expect(body.error).toMatch(/No mail sent/i);
    }
  });

  it('keeps staff auth surfaces noindex and out of the sitemap', async () => {
    expect(staffLoginMetadata.robots).toMatchObject({ index: false, follow: false });
    expect(staffSeatsMetadata.robots).toMatchObject({ index: false, follow: false });
    expect(staffDeskMetadata.robots).toMatchObject({ index: false, follow: false });
    expect(String(staffDeskMetadata.title)).toMatch(/Worker Home/i);
    expect(String(staffDeskMetadata.description)).toMatch(/Schedule/i);
    expect(String(staffDeskMetadata.description)).toMatch(/bar-week extras/i);
    expect(String(staffDeskMetadata.description)).toMatch(/Needs Approval/i);
    const entries = await sitemap();
    expect(entries.some((entry) => String(entry.url).includes('/staff'))).toBe(false);
  });
});
