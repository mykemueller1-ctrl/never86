import { MCP_PUBLIC_TOOLS, assertAllPublicToolsReadOnly } from '../mcpPublicContract';
import { FORBIDDEN_LIVE_WRITES, getNever86SkillPack } from './skillPack';

export const CERTIFICATION_GATES = ['READ-ONLY', 'DRAFT-ONLY'] as const;
export type CertificationGate = (typeof CERTIFICATION_GATES)[number];

export type CertificationResult = {
  skillPackId: string;
  skillPackVersion: string;
  operatorSystemVersion: string;
  gates: Record<CertificationGate, {
    status: 'certified-in-repo';
    liveVerified: false;
    summary: string;
    checks: string[];
  }>;
  liveExternalWrites: 'none';
  marketplacePublication: 'not-claimed';
  liveProviderInstall: 'unverified';
  ok: true;
};

export function certifyReadOnlyThenDraftOnly(): CertificationResult {
  const pack = getNever86SkillPack();
  const readOnlyFailures = assertAllPublicToolsReadOnly(MCP_PUBLIC_TOOLS);
  if (readOnlyFailures.length > 0) {
    throw new Error(`READ-ONLY certification failed: ${readOnlyFailures.join('; ')}`);
  }
  if (pack.backend.allowedTools.join(',') !== MCP_PUBLIC_TOOLS.map((tool) => tool.name).join(',')) {
    throw new Error('Skill pack tools drifted from the public MCP contract.');
  }

  return {
    skillPackId: pack.id,
    skillPackVersion: pack.version,
    operatorSystemVersion: pack.backend.operatorSystemVersion,
    gates: {
      'READ-ONLY': {
        status: 'certified-in-repo',
        liveVerified: false,
        summary: 'Public MCP tools are read-only. Shells expose those tools only. No live external writes.',
        checks: [
          'Every public MCP tool sets readOnlyHint true and destructiveHint false.',
          'Shells may not register send, post, refund, payroll, payment, discipline, or access-grant tools.',
          `Forbidden live writes: ${FORBIDDEN_LIVE_WRITES.join(', ')}.`,
        ],
      },
      'DRAFT-ONLY': {
        status: 'certified-in-repo',
        liveVerified: false,
        summary: 'Vendor and service messages stay copyable drafts. A human reviews and sends. Shells never send.',
        checks: [
          'Service drafts require store context, source fact, requested resolution, owner, and requested proof.',
          'A draft is not a sent message, accepted claim, vendor commitment, or completed repair.',
          'READ-ONLY is certified before DRAFT-ONLY. Drafting does not unlock live writes.',
        ],
      },
    },
    liveExternalWrites: 'none',
    marketplacePublication: 'not-claimed',
    liveProviderInstall: 'unverified',
    ok: true,
  };
}
