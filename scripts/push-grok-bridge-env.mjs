#!/usr/bin/env node
/**
 * Push Grok→Cursor bridge env vars to Vercel (never86 project).
 * Usage (secret box / shell only — never commit values):
 *   VERCEL_TOKEN=... CURSOR_API_KEY=... node scripts/push-grok-bridge-env.mjs
 */
import crypto from 'crypto';

const VERCEL_TOKEN = process.env.VERCEL_TOKEN?.trim();
const CURSOR_API_KEY = process.env.CURSOR_API_KEY?.trim();
const TEAM_SLUG = process.env.VERCEL_TEAM_SLUG || 'mykes-projects-6f549d7f';
const PROJECT_NAME = process.env.VERCEL_PROJECT_NAME || 'never86';

if (!VERCEL_TOKEN) {
  console.error('Missing VERCEL_TOKEN');
  process.exit(1);
}
if (!CURSOR_API_KEY) {
  console.error('Missing CURSOR_API_KEY');
  process.exit(1);
}

const orchestratorToken =
  process.env.NEVER86_ORCHESTRATOR_TOKEN?.trim() || crypto.randomBytes(32).toString('hex');
const oauthSecret =
  process.env.NEVER86_OAUTH_CLIENT_SECRET?.trim() || crypto.randomBytes(32).toString('hex');

const envVars = [
  ['NEVER86_ORCHESTRATOR_TOKEN', orchestratorToken],
  ['NEVER86_OAUTH_CLIENT_SECRET', oauthSecret],
  ['NEVER86_OAUTH_CLIENT_ID', process.env.NEVER86_OAUTH_CLIENT_ID || 'grok-never86-cursor'],
  ['CURSOR_API_KEY', CURSOR_API_KEY],
  ['CURSOR_ALLOWED_STARTING_REFS', process.env.CURSOR_ALLOWED_STARTING_REFS || 'main,codex/action-shift-122-safe,recovery-apr12'],
  ['CURSOR_AUTONOMOUS_DISPATCH_ENABLED', process.env.CURSOR_AUTONOMOUS_DISPATCH_ENABLED || 'false'],
];

async function vercel(path, init = {}) {
  const res = await fetch(`https://api.vercel.com${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${VERCEL_TOKEN}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { raw: text };
  }
  if (!res.ok) {
    throw new Error(`${init.method || 'GET'} ${path} → ${res.status}: ${JSON.stringify(body)}`);
  }
  return body;
}

async function main() {
  const teams = await vercel('/v2/teams');
  const team = teams.teams?.find((t) => t.slug === TEAM_SLUG || t.name === TEAM_SLUG);
  const teamId = team?.id;
  if (!teamId) {
    throw new Error(`Team not found: ${TEAM_SLUG}`);
  }

  const project = await vercel(`/v9/projects/${PROJECT_NAME}?teamId=${teamId}`);
  const projectId = project.id;
  console.log(`Project: ${project.name} (${projectId})`);

  const existing = await vercel(`/v9/projects/${projectId}/env?teamId=${teamId}`);
  const byKey = new Map((existing.envs || []).map((e) => [e.key, e]));

  for (const [key, value] of envVars) {
    const prev = byKey.get(key);
    if (prev) {
      await vercel(`/v9/projects/${projectId}/env/${prev.id}?teamId=${teamId}`, {
        method: 'PATCH',
        body: JSON.stringify({ value, target: ['production', 'preview', 'development'] }),
      });
      console.log(`Updated ${key}`);
    } else {
      await vercel(`/v10/projects/${projectId}/env?teamId=${teamId}`, {
        method: 'POST',
        body: JSON.stringify({
          key,
          value,
          type: 'encrypted',
          target: ['production', 'preview', 'development'],
        }),
      });
      console.log(`Created ${key}`);
    }
  }

  const deploy = await vercel(`/v13/deployments?teamId=${teamId}`, {
    method: 'POST',
    body: JSON.stringify({
      name: PROJECT_NAME,
      project: projectId,
      target: 'production',
      gitSource: {
        type: 'github',
        org: 'mykemueller1-ctrl',
        repo: 'never86',
        ref: 'main',
      },
    }),
  });
  console.log(`Production redeploy triggered: ${deploy.id || deploy.url || 'ok'}`);
  console.log('Grok bridge env ready. Keep CURSOR_AUTONOMOUS_DISPATCH_ENABLED=false until first dry run.');
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
