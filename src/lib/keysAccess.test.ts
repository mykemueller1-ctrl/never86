import { afterEach, describe, expect, it, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  KEYS_ACCESS_CATALOG,
  KEYS_ACCESS_DOC,
  KEYS_ACCESS_TASK_ID,
  PRIVATE_ORCHESTRATOR_MCP_URL,
  PUBLIC_MCP_URL,
  XAI_API_BASE_DEFAULT,
  XAI_API_KEY_NAME,
  assertNoEmbeddedSecrets,
  catalogPresence,
  inspectKeyPresence,
  keysAccessSummary,
  probeOrchestratorUnauthenticated,
  probePublicMcp,
  probeXaiModels,
  xaiApiBase,
} from './keysAccess';

const REPO_ROOT = path.resolve(__dirname, '../..');

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('keys access catalog', () => {
  it('names the xAI / Grok and factory keys without embedding live secrets', () => {
    const names = KEYS_ACCESS_CATALOG.map((item) => item.name);
    expect(names).toEqual(expect.arrayContaining([
      XAI_API_KEY_NAME,
      'XAI_API_BASE',
      'NEVER86_OAUTH_CLIENT_SECRET',
      'CURSOR_API_KEY',
      'ANTHROPIC_API_KEY',
    ]));
    expect(assertNoEmbeddedSecrets(KEYS_ACCESS_CATALOG)).toEqual([]);
    expect(KEYS_ACCESS_TASK_ID).toBe('keys-access-env-v1');
    expect(fs.existsSync(path.join(REPO_ROOT, KEYS_ACCESS_DOC))).toBe(true);
  });

  it('reports presence and length only — never the value', () => {
    const env = {
      XAI_API_KEY: 'xai-this-is-not-a-real-key-and-must-not-leak',
      CURSOR_API_KEY: '',
    };
    const rows = inspectKeyPresence([XAI_API_KEY_NAME, 'CURSOR_API_KEY', 'MISSING_KEY'], env);
    expect(rows).toEqual([
      { name: XAI_API_KEY_NAME, present: true, nonempty: true, length: env.XAI_API_KEY.length },
      { name: 'CURSOR_API_KEY', present: true, nonempty: false, length: 0 },
      { name: 'MISSING_KEY', present: false, nonempty: false, length: 0 },
    ]);
    const serialized = JSON.stringify(rows);
    expect(serialized).not.toContain('xai-this-is-not-a-real-key');
    expect(keysAccessSummary(rows).xaiKey).toBe('present');
    expect(keysAccessSummary(rows).note).toMatch(/never returned/i);
  });

  it('defaults the xAI base and ignores blank overrides', () => {
    expect(xaiApiBase({})).toBe(XAI_API_BASE_DEFAULT);
    expect(xaiApiBase({ XAI_API_BASE: '  https://api.x.ai/v1/  ' })).toBe('https://api.x.ai/v1');
  });

  it('keeps .env.example and mcp.json free of live secrets and conflict markers', () => {
    const envExample = fs.readFileSync(path.join(REPO_ROOT, '.env.example'), 'utf8');
    const mcp = fs.readFileSync(path.join(REPO_ROOT, '.cursor/mcp.json'), 'utf8');
    expect(envExample).toMatch(/XAI_API_KEY=/);
    expect(envExample).toMatch(/NEVER86_OAUTH_CLIENT_SECRET=/);
    expect(envExample).not.toMatch(/<<<<<<<|=======|>>>>>>>/);
    expect(mcp).toContain('never86-operator-system');
    expect(mcp).toContain(PUBLIC_MCP_URL);
    expect(mcp).not.toMatch(/<<<<<<<|=======|>>>>>>>/);
    expect(envExample).not.toMatch(/xai-[A-Za-z0-9]{16,}|key_[A-Za-z0-9]{16,}/);
    expect(fs.readFileSync(path.join(REPO_ROOT, '.gitignore'), 'utf8')).toMatch(/^\.env$/m);
  });
});

describe('keys access probes', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('does not call xAI when the key is absent', async () => {
    const fetchMock = vi.fn();
    await expect(probeXaiModels({}, fetchMock)).resolves.toMatchObject({ status: 'not-configured' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('treats a 200 models list as live-verified without spending a completion', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { data: [{ id: 'grok-4' }, { id: 'grok-3' }] }));
    const result = await probeXaiModels({ XAI_API_KEY: 'test-xai-key-not-real' }, fetchMock);
    expect(result).toEqual({ status: 'live-verified', httpStatus: 200, modelCount: 2 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${XAI_API_BASE_DEFAULT}/models`);
    expect(init.method).toBe('GET');
    expect(init.headers.Authorization).toBe('Bearer test-xai-key-not-real');
  });

  it('maps xAI 401 to unauthorized without throwing the key', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(401, { error: 'nope' }));
    const result = await probeXaiModels({ XAI_API_KEY: 'test-xai-key-not-real' }, fetchMock);
    expect(result.status).toBe('unauthorized');
    expect(JSON.stringify(result)).not.toContain('test-xai-key-not-real');
  });

  it('verifies public MCP initialize + tools/list', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse(200, { jsonrpc: '2.0', id: 1, result: { serverInfo: { name: 'never86' } } }))
      .mockResolvedValueOnce(jsonResponse(200, { jsonrpc: '2.0', id: 2, result: { tools: [{ name: 'get_operator_system' }] } }));
    await expect(probePublicMcp(fetchMock)).resolves.toEqual({
      status: 'live-verified',
      httpStatus: 200,
      serverName: 'never86',
      toolCount: 1,
    });
  });

  it('treats unauthenticated private MCP 401/503 as fail-closed', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(401, { error: 'Unauthorized.' }));
    await expect(probeOrchestratorUnauthenticated(fetchMock)).resolves.toMatchObject({
      status: 'fail-closed',
      httpStatus: 401,
    });
    expect(fetchMock.mock.calls[0][0]).toBe(PRIVATE_ORCHESTRATOR_MCP_URL);
  });
});

describe('catalogPresence uses process.env without leaking', () => {
  it('serializes only names and flags', () => {
    const rows = catalogPresence({ [XAI_API_KEY_NAME]: undefined } as NodeJS.ProcessEnv);
    expect(rows.some((row) => row.name === XAI_API_KEY_NAME)).toBe(true);
    expect(JSON.stringify(rows)).not.toMatch(/xai-[A-Za-z0-9]{16,}/);
  });
});
