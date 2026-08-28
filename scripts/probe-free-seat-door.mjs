#!/usr/bin/env node
/**
 * Probe stranger-door readiness on a deployed host.
 * Usage: node scripts/probe-free-seat-door.mjs https://www.never86.ai
 * Never logs tokens or DATABASE_URL.
 */
const base = (process.argv[2] || 'https://www.never86.ai').replace(/\/$/, '');
const email = `door-probe+${Date.now()}@never86.test`;
const body = {
  email,
  restaurantName: 'Door Probe Lab',
  operatorName: 'Probe',
  sourcePage: '/onboard',
};
const res = await fetch(`${base}/api/onboard/request`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(body),
});
const text = await res.text();
let json;
try {
  json = JSON.parse(text);
} catch {
  json = { raw: text.slice(0, 500) };
}
if (json && typeof json === 'object') {
  delete json.debugActivatePath;
  delete json.rawToken;
  delete json.token;
}
console.log(JSON.stringify({ status: res.status, body: json }, null, 2));
if (res.status === 503 && /Free-seat tables not on Neon/i.test(text)) {
  console.error('BLOCKED: apply drizzle/0002 + 0003 via scripts/apply-free-seat.sh, then re-run.');
  process.exit(3);
}
if (res.status === 503 && (json?.code === 'activation_email_unavailable' || /activation email/i.test(text))) {
  console.error('TABLES LOOK REACHABLE: activation email is unavailable (fail closed). Do not mint/return tokens.');
  process.exit(4);
}
if (!res.ok) process.exit(1);
console.log('Door accept path responded OK (check email delivery separately).');
