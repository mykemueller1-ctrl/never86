import {
  DEPARTMENTS,
  getDepartmentPlaybook,
  getRoleById,
  type DepartmentId,
} from '../companyOrg';
import { redactStorePrivateForCompany } from './gates';
import type { CompanyRoute } from './types';

export type CompanyJob = {
  id: string;
  text: string;
};

const RULES: Array<{ dept: DepartmentId; pattern: RegExp; reason: string }> = [
  { dept: 'sales', pattern: /\b(audit invite|intake|outbound|reply desk|lead desk)\b/i, reason: 'Sales owns intake and founder-approved outreach drafts.' },
  { dept: 'social', pattern: /\b(social|clip factory|linkedin|x post|tiktok|reels|publish queue)\b/i, reason: 'Social Command drafts; Myke remains the release gate.' },
  { dept: 'marketing', pattern: /\b(hunter|icp|reddit|hunt pack)\b/i, reason: 'Marketing owns the daily hunt. No auto-post.' },
  { dept: 'gtm', pattern: /\b(campaign|content brief|utm|gtm)\b/i, reason: 'GTM chooses campaigns and measures qualified behavior.' },
  { dept: 'audit', pattern: /\b(statement|payout|rate card|marketplace|3p fee)\b/i, reason: 'Audit Delivery runs deterministic reconciliation before narrative.' },
  { dept: 'product', pattern: /\b(product|workflow|parser|build|truth gate|swarm)\b/i, reason: 'Product builds the smallest testable workflow and blocks unsupported claims.' },
];

export function routeCompanyJob(job: CompanyJob): CompanyRoute {
  const text = redactStorePrivateForCompany(job.text);
  const match = RULES.find((rule) => rule.pattern.test(text));
  if (!match) {
    return {
      departmentId: null,
      departmentName: 'Founder hold',
      headId: 'founder-chief-of-staff',
      roleId: 'founder-chief-of-staff',
      roleName: 'Founder Chief of Staff',
      reason: 'No department keyword. Founder Chief of Staff holds the job instead of guessing.',
      approvalRequired: [],
      storePrivateAttached: false,
      nextAction: 'Rewrite the job with a department trigger, or leave it in the founder inbox.',
    };
  }

  const pack = getDepartmentPlaybook(match.dept);
  const dept = DEPARTMENTS.find((d) => d.id === match.dept);
  const head = pack.ok ? pack.head : getRoleById(dept?.headId ?? '');
  return {
    departmentId: match.dept,
    departmentName: dept?.name ?? match.dept,
    headId: head?.id ?? null,
    roleId: head?.id ?? match.dept,
    roleName: head?.name ?? match.dept,
    reason: match.reason,
    approvalRequired: head?.approvalRequired ?? [],
    storePrivateAttached: false,
    nextAction: `${head?.name ?? 'Department head'} drafts. Myke approves any external send.`,
  };
}

export const SAMPLE_COMPANY_JOBS: CompanyJob[] = [
  { id: 'sales-invite', text: 'Draft an audit invite for a public Fort Dodge independent. Do not send.' },
  { id: 'marketing-hunt', text: 'Prepare the hunter ICP hunt pack for X and Reddit. Draft only.' },
  { id: 'gtm-brief', text: 'Write a GTM content brief from permissioned public proof. No store-private dollars.' },
  { id: 'social-clips', text: 'Queue three founder-product clip drafts for the X clip factory. Do not publish.' },
  { id: 'audit-statement', text: 'Run the public 3P fee statement ladder on a redacted sample. No portal login.' },
  { id: 'product-swarm', text: 'Activate the command-center swarm workflow and keep truth gates on.' },
];
