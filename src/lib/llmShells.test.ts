import { describe, expect, it } from 'vitest';
import { MCP_PUBLIC_TOOLS, assertAllPublicToolsReadOnly } from './mcpPublicContract';
import { NEVER86_MCP_URL } from './cursorDispatch';
import {
  EXISTING_NEVER86_ARTIFACTS,
  NEVER86_SKILL_PACK_VERSION,
  certifyReadOnlyThenDraftOnly,
  getInstallMatrix,
  getNever86SkillPack,
  listLlmShells,
} from './llmShells';
import {
  applyShellPolicy,
  evaluateEvidenceLanguage,
  evaluateManagerProofEscalation,
  evaluateNoSideEffectSafety,
  evaluateProviderShellParity,
  evaluateTenantIsolation,
} from './llmShells/evals';

describe('Never86 four-LLM thin shells', () => {
  it('keeps one provider-neutral skill pack pointed at the existing MCP backend', () => {
    const pack = getNever86SkillPack();
    expect(pack.providerNeutral).toBe(true);
    expect(pack.backend.mcpUrl).toBe(NEVER86_MCP_URL);
    expect(pack.backend.forbidsForkedBusinessLogic).toBe(true);
    expect(pack.backend.allowedTools).toEqual(MCP_PUBLIC_TOOLS.map((tool) => tool.name));
    expect(pack.instructions).toMatch(/Do not fork formulas/);
    expect(EXISTING_NEVER86_ARTIFACTS.privateOrchestrator.excludedFromPublicShells).toBe(true);
  });

  it('certifies READ-ONLY first and DRAFT-ONLY second with no live writes', () => {
    expect(assertAllPublicToolsReadOnly()).toEqual([]);
    const cert = certifyReadOnlyThenDraftOnly();
    expect(cert.ok).toBe(true);
    expect(cert.gates['READ-ONLY'].status).toBe('certified-in-repo');
    expect(cert.gates['DRAFT-ONLY'].status).toBe('certified-in-repo');
    expect(cert.gates['READ-ONLY'].liveVerified).toBe(false);
    expect(cert.liveExternalWrites).toBe('none');
    expect(cert.marketplacePublication).toBe('not-claimed');
  });

  it('exposes four thin shells with an honest install matrix', () => {
    const shells = listLlmShells();
    expect(shells.map((shell) => shell.provider)).toEqual(['chatgpt', 'claude', 'gemini', 'grok']);
    const matrix = getInstallMatrix();
    expect(matrix.status.marketplacePublication).toBe('not-submitted');
    expect(matrix.status.liveProviderInstall).toBe('unverified');
    expect(matrix.status.credentials).toBe('none-claimed');
    for (const shell of matrix.shells) {
      expect(shell.skillPackVersion).toBe(NEVER86_SKILL_PACK_VERSION);
      expect(shell.mcpUrl).toBe(matrix.skillPack.mcpUrl);
      expect(shell.credentials).toBe('none-claimed');
    }
  });
});

describe('shared synthetic evals', () => {
  it('keeps tenant isolation across workforce matching and every shell', () => {
    const { plan, shellDecisions } = evaluateTenantIsolation();
    expect(plan.ok).toBe(true);
    if (!plan.ok) return;
    expect(plan.plan.assignments).toEqual([
      expect.objectContaining({ externalShiftId: 'shift-alpha', seatId: 'seat-manager-alpha' }),
    ]);
    expect(plan.plan.unmatched).toEqual([
      { externalShiftId: 'shift-beta-steal', reason: 'identity_not_found' },
    ]);
    expect(plan.plan.assignments[0].checklistTemplateIds).toEqual(['manager-close-alpha']);
    expect(plan.plan.assignments[0].checklistTemplateIds).not.toContain('manager-close-beta');
    for (const decision of shellDecisions) {
      expect(decision.tenantAllowed).toBe(false);
      expect(decision.sideEffect).toBe('blocked');
      expect(decision.evidenceLanguage).toBe('Missing Evidence');
    }
  });

  it('requires manager proof and escalates overdue unverified steps', () => {
    const { shift, verbal, overdue, proven } = evaluateManagerProofEscalation();
    expect(shift.ok).toBe(true);
    if (!shift.ok) return;
    expect(shift.result.morningActions[0].proof.verbalYesCloses).toBe(false);
    expect(shift.result.nightCloseCheck.length).toBeGreaterThan(0);
    expect(shift.result.missingEvidence.join(' ')).toMatch(/Deposit slip|Missing Evidence|POS close/i);
    expect(verbal.actionState).toBe('acknowledged');
    expect(verbal.evidenceLanguage).toBe('Unverified');
    expect(overdue.actionState).toBe('escalated');
    expect(overdue.escalateTo).toBe('manager-seat');
    expect(overdue.evidenceLanguage).toBe('Missing Evidence');
    expect(proven.actionState).toBe('verified');
    expect(shift.result.policy.boundary).toMatch(/does not make theft/i);
  });

  it('keeps evidence-status language and refuses invented facts', () => {
    const { missingTarget, pack, forbiddenClaims } = evaluateEvidenceLanguage();
    expect(missingTarget.ok).toBe(true);
    if (!missingTarget.ok) return;
    expect(missingTarget.result.sourceStatus).toBe('unverified');
    expect(missingTarget.result.morningActions[0].id).toBe('close-packet');
    expect(missingTarget.result.morningActions[0].claimBoundary).toMatch(/does not prove the shift was clean/);
    expect(pack.evidenceStatusWords).toEqual(expect.arrayContaining(['Unverified', 'Missing Evidence']));
    expect(pack.instructions).toMatch(/Missing Evidence is not \$0/);
    expect(forbiddenClaims).toEqual(expect.arrayContaining(['theft', 'recovered cash']));
    expect(missingTarget.result.summary.toLowerCase()).not.toMatch(/thief|guaranteed savings|recovered cash|overcharge proven/);
    expect(missingTarget.result.policy.boundary).toMatch(/does not make theft/i);
  });

  it('blocks live side effects and allows drafts only after READ-ONLY', () => {
    const rows = evaluateNoSideEffectSafety();
    const byId = Object.fromEntries(rows.map((row) => [row.prompt.id, row.decision]));
    expect(byId['send-vendor-email'].sideEffect).toBe('blocked');
    expect(byId['post-x'].sideEffect).toBe('blocked');
    expect(byId['refund-doordash'].sideEffect).toBe('blocked');
    expect(byId['draft-vendor'].sideEffect).toBe('draft-only');
    expect(rows[0].allowedTools.every((name) => !/send|post|refund|pay/i.test(name))).toBe(true);
  });

  it('keeps provider-shell parity on skill, tools, and policy', () => {
    const { shells, decisions } = evaluateProviderShellParity();
    const first = shells[0];
    for (const shell of shells) {
      expect(shell.skillPackId).toBe(first.skillPackId);
      expect(shell.skillPackVersion).toBe(first.skillPackVersion);
      expect(shell.mcp.url).toBe(first.mcp.url);
      expect(shell.mcp.tools).toEqual(first.mcp.tools);
      expect(shell.instructions).toBe(first.instructions);
      expect(shell.forbidsForkedBusinessLogic).toBe(true);
      expect(shell.certification.gates['READ-ONLY'].status).toBe('certified-in-repo');
      expect(shell.certification.gates['DRAFT-ONLY'].status).toBe('certified-in-repo');
    }
    const canonical = {
      sideEffect: decisions[0].sideEffect,
      inventedFacts: false,
      allowedTools: decisions[0].allowedTools,
      skillPackVersion: decisions[0].skillPackVersion,
    };
    for (const decision of decisions) {
      expect(decision.sideEffect).toBe(canonical.sideEffect);
      expect(decision.inventedFacts).toBe(false);
      expect(decision.allowedTools).toEqual(canonical.allowedTools);
      expect(decision.skillPackVersion).toBe(canonical.skillPackVersion);
    }
    expect(applyShellPolicy({
      provider: 'chatgpt',
      actingTenantId: 101,
      requestedAction: 'read',
    }).sideEffect).toBe('none');
  });
});
