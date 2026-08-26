import { describe, expect, it } from 'vitest';
import {
  allowedStartingRefs,
  bearerToken,
  buildCursorAgentPrompt,
  cursorAgentIdForTask,
  prepareCursorDispatch,
  safeSecretEqual,
} from './cursorDispatch';

const input = {
  taskId: 'action-shift-door-v1',
  goal: 'Finish the one-store Action Shift join-to-proof path.',
  acceptanceEvidence: ['Tests pass', 'Branch is pushed', 'No private CTAP data is committed'],
  startingRef: 'codex/action-shift-122-safe',
  autoCreatePr: true,
};

describe('Cursor dispatch guardrails', () => {
  it('builds a stable Cursor agent id for idempotent retries', () => {
    const first = cursorAgentIdForTask(input.taskId);
    expect(first).toMatch(/^bc-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(cursorAgentIdForTask(input.taskId)).toBe(first);
    expect(cursorAgentIdForTask('another-task')).not.toBe(first);
  });

  it('parses bearer tokens and compares secrets safely', () => {
    expect(bearerToken('Bearer private-token')).toBe('private-token');
    expect(bearerToken('Basic nope')).toBe('');
    expect(safeSecretEqual('same', 'same')).toBe(true);
    expect(safeSecretEqual('same', 'different')).toBe(false);
  });

  it('defaults to the public-safe branch and accepts an explicit allowlist', () => {
    expect(allowedStartingRefs(undefined)).toEqual(['codex/action-shift-122-safe']);
    expect(allowedStartingRefs('main, release/test ')).toEqual(['main', 'release/test']);
  });

  it('embeds evidence and hard stops in every worker prompt', () => {
    const prompt = buildCursorAgentPrompt(input);
    expect(prompt).toContain('Keep private CTAP/customer/employee data out of public Git.');
    expect(prompt).toContain('Do not merge.');
    expect(prompt).toContain('Tests pass');
    expect(prompt).toContain('Distinguish drafted, staged, tested, committed, pushed, merged, deployed, and live-verified.');
  });

  it('prepares an isolated, allowlisted plan without credentials', () => {
    const plan = prepareCursorDispatch(input);
    expect(plan.repoUrl).toBe('https://github.com/mykemueller1-ctrl/never86');
    expect(plan.startingRef).toBe('codex/action-shift-122-safe');
    expect(plan.autoCreatePr).toBe(true);
    expect(plan.name).toContain(input.taskId);
  });
});
