import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  APPROVAL_GATES,
  COMPANY_ROLES,
  DEPARTMENTS,
  getAllPlaybookRefs,
  getCompanyOrg,
  getDepartmentPlaybook,
  getRoleById,
} from './companyOrg';

const REPO_ROOT = path.resolve(__dirname, '../..');

describe('companyOrg', () => {
  it('returns a versioned org with six departments', () => {
    const org = getCompanyOrg();
    expect(org.version).toBeTruthy();
    expect(org.departments).toHaveLength(6);
    expect(org.founder).toBe('Myke Mueller');
    expect(org.approvalGates).toEqual([...APPROVAL_GATES]);
  });

  it('every specialist reports to a valid role', () => {
    const ids = new Set(COMPANY_ROLES.map((r) => r.id));
    for (const role of COMPANY_ROLES) {
      if (role.reportsTo) {
        expect(ids.has(role.reportsTo)).toBe(true);
      }
    }
  });

  it('every department head exists and matches department.headId', () => {
    for (const dept of DEPARTMENTS) {
      const head = getRoleById(dept.headId);
      expect(head).toBeDefined();
      expect(head?.tier).toBe('department_head');
      expect(head?.departmentId).toBe(dept.id);
    }
  });

  it('maps 100-statement playbook agents to sales, gtm, and audit', () => {
    const intake = getRoleById('intake-router');
    const reply = getRoleById('reply-desk');
    const evidence = getRoleById('evidence-gate');
    const reconcile = getRoleById('marketplace-audit');
    const receipt = getRoleById('operator-receipt');
    const proof = getRoleById('proof-to-content');
    const dist = getRoleById('distribution-queue');
    const measure = getRoleById('measurement-learning');

    expect(intake?.playbookSection).toContain('Agent 1');
    expect(reply?.playbookSection).toContain('Agent 7');
    expect(evidence?.playbookSection).toContain('Agent 2');
    expect(reconcile?.playbookSection).toContain('Agent 3');
    expect(receipt?.playbookSection).toContain('Agent 4');
    expect(proof?.playbookSection).toContain('Agent 5');
    expect(dist?.playbookSection).toContain('Agent 6');
    expect(measure?.playbookSection).toContain('Agent 8');
  });

  it('outbound lead references earned-authority pack', () => {
    const outbound = getRoleById('outbound-lead');
    expect(outbound?.playbookRef).toBe('docs/launch/earned-authority-outreach-pack.md');
    expect(outbound?.reportsTo).toBe('sales-head');
  });

  it('getDepartmentPlaybook returns pack for each department', () => {
    for (const dept of DEPARTMENTS) {
      const pack = getDepartmentPlaybook(dept.id);
      expect(pack.ok).toBe(true);
      if (pack.ok) {
        expect(pack.department.id).toBe(dept.id);
        expect(pack.head?.id).toBe(dept.headId);
        expect(pack.specialists.length).toBeGreaterThan(0);
      }
    }
  });

  it('marketing department has Head of Marketing and hunter specialists', () => {
    const pack = getDepartmentPlaybook('marketing');
    expect(pack.ok).toBe(true);
    if (pack.ok) {
      expect(pack.head?.id).toBe('head-of-marketing');
      expect(pack.specialists.map((s) => s.id)).toEqual(
        expect.arrayContaining(['hunter-scanner', 'icp-scorer', 'hook-drafter']),
      );
    }
  });

  it('social department runs one Grok newsroom with platform and operations specialists', () => {
    const pack = getDepartmentPlaybook('social');
    expect(pack.ok).toBe(true);
    if (pack.ok) {
      expect(pack.head?.id).toBe('social-head');
      expect(pack.specialists.map((s) => s.id)).toEqual(
        expect.arrayContaining([
          'social-intelligence',
          'editorial-strategist',
          'x-linkedin-desk',
          'short-form-studio',
          'youtube-hunt',
          'youtube-script-cutter',
          'youtube-answer-film',
          'youtube-channel-producer',
          'facebook-community-desk',
          'reddit-forum-desk',
          'repurposing-editor',
          'social-publishing-queue',
          'social-performance',
        ]),
      );
    }
  });

  it('rejects unknown department', () => {
    const pack = getDepartmentPlaybook('hubspot');
    expect(pack.ok).toBe(false);
    if (!pack.ok) {
      expect(pack.error).toContain('hubspot');
    }
  });

  it('every playbook ref resolves to a file in the repo', () => {
    for (const ref of getAllPlaybookRefs()) {
      const fullPath = path.join(REPO_ROOT, ref);
      expect(fs.existsSync(fullPath), `missing playbook: ${ref}`).toBe(true);
    }
    expect(getAllPlaybookRefs()).toContain('docs/company/KEYS_ACCESS.md');
  });

  it('adds first-party YouTube desk seats under social with a drafts-only publish gate', () => {
    for (const id of ['youtube-hunt', 'youtube-script-cutter', 'youtube-answer-film', 'youtube-channel-producer']) {
      const role = getRoleById(id);
      expect(role?.departmentId).toBe('social');
      expect(role?.reportsTo).toBe('social-head');
      expect(role?.playbookRef).toBe('docs/company/grok-bots/YOUTUBE_DESK.md');
      expect(role?.approvalRequired).toContain('social_post');
      expect(role?.prohibited).toEqual(
        expect.arrayContaining(['auto-uploading to YouTube', 'opening private CTAP or customer files']),
      );
    }
    const pack = getDepartmentPlaybook('social');
    expect(pack.ok).toBe(true);
    if (pack.ok) {
      expect(pack.playbookRefs).toContain('docs/company/grok-bots/YOUTUBE_DESK.md');
      expect(pack.youtubeDesk).toBe('docs/company/grok-bots/YOUTUBE_DESK.md');
    }
  });

  it('adds Grok Shareable Scout under product with a resolving playbook', () => {
    const scout = getRoleById('grok-shareable-scout');
    expect(scout?.departmentId).toBe('product');
    expect(scout?.reportsTo).toBe('product-head');
    expect(scout?.playbookRef).toBe('docs/company/grok-bots/WORKFLOW.md');
    expect(scout?.prohibited).toEqual(
      expect.arrayContaining(['auto-installing a share link', 'pasting API keys or connector secrets into a bot or Git']),
    );
    const pack = getDepartmentPlaybook('product');
    expect(pack.ok).toBe(true);
    if (pack.ok) {
      expect(pack.specialists.map((s) => s.id)).toContain('grok-shareable-scout');
      expect(pack.playbookRefs).toContain('docs/company/grok-bots/WORKFLOW.md');
    }
  });

  it('sales and reply desk require approval for external actions', () => {
    const salesHead = getRoleById('sales-head');
    const replyDesk = getRoleById('reply-desk');
    expect(salesHead?.approvalRequired).toContain('social_reply');
    expect(replyDesk?.approvalRequired).toContain('dm_reply');
    expect(replyDesk?.prohibited).toContain('auto-posting or auto-replying');
  });
});
