import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it } from 'vitest';
import { GET, POST } from './route';

const HASH_ENV = 'HOUSE_CODE_HASH';
const OPERATOR_ENV = 'HOUSE_CODE_OPERATOR_ID';
const PEPPER_ENV = 'HOUSE_CODE_PEPPER';

afterEach(() => {
  delete process.env[HASH_ENV];
  delete process.env[OPERATOR_ENV];
  delete process.env[PEPPER_ENV];
});

describe('/api/portal/house', () => {
  it('GET and POST return 401 without a valid issued code', async () => {
    const getResponse = await GET();
    expect(getResponse.status).toBe(401);
    const getBody = await getResponse.json();
    expect(getBody.ok).toBe(false);
    expect(getBody.liveIssuance).toBe('blocked');
    expect(getBody.seatDoor).toBe('/portal');
    expect(JSON.stringify(getBody)).not.toMatch(/karlee|sturtz|pin/i);

    const postResponse = await POST(
      new NextRequest('http://localhost/api/portal/house', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      }),
    );
    expect(postResponse.status).toBe(401);
    const postBody = await postResponse.json();
    expect(postBody.ok).toBe(false);
    expect(postBody.error).toBe('not_issued');
  });

  it('POST returns 401 for a wrong code after a hash is present', async () => {
    const { hashHouseCode, SYNTHETIC_HOUSE_CODE } = await import('@/lib/houseCode');
    process.env[HASH_ENV] = hashHouseCode(SYNTHETIC_HOUSE_CODE, 'test');
    process.env[OPERATOR_ENV] = '1';
    process.env[PEPPER_ENV] = 'test';

    const response = await POST(
      new NextRequest('http://localhost/api/portal/house', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: 'NOT-THE-CODE' }),
      }),
    );
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.ok).toBe(false);
    expect(body.error).toBe('invalid');
    expect(body.liveIssuance).toBe('blocked');
  });
});
