export const COMPANY_ORG_VERSION = '2.0.0';

export type DepartmentId = 'sales' | 'gtm' | 'marketing' | 'social' | 'audit' | 'product';
export type RoleTier = 'founder' | 'department_head' | 'specialist';

export type CompanyRole = {
  id: string;
  name: string;
  tier: RoleTier;
  departmentId: DepartmentId | null;
  reportsTo: string | null;
  job: string;
  playbookRef: string;
  playbookSection?: string;
  mcpFirstCall: string[];
  triggers?: string[];
  outputs?: string[];
  prohibited?: string[];
  approvalRequired: string[];
};

export type Department = {
  id: DepartmentId;
  name: string;
  headId: string;
  mission: string;
  playbookRefs: string[];
};

const PLAYBOOK_HUNTER = 'docs/gtm/hunter-bots/system-prompts.md';
const PLAYBOOK_HUNTER_HUNT = 'docs/gtm/hunter-bots/grok-first-hunt.md';
const PLAYBOOK_HUNTER_QUERIES = 'docs/gtm/hunter-bots/search-queries.md';
const PLAYBOOK_100_STATEMENT = 'docs/launch/100-statement-agent-playbook.md';
const PLAYBOOK_EARNED_AUTHORITY = 'docs/launch/earned-authority-outreach-pack.md';
const PLAYBOOK_SOCIAL = 'docs/launch/100-statement-social-pack.md';
const PLAYBOOK_SOCIAL_OS = 'docs/gtm/social-bots/operating-system.md';
const PLAYBOOK_GROK_SWARM = 'docs/company/grok-bots/WORKFLOW.md';

export const APPROVAL_GATES = [
  'external_email_send',
  'social_post',
  'social_reply',
  'dm_reply',
  'podcast_pitch_send',
  'partner_outreach_send',
  'permissioned_case_study_publish',
  'recovery_or_refund_claim',
] as const;

export const DEPARTMENTS: Department[] = [
  {
    id: 'sales',
    name: 'Sales',
    headId: 'sales-head',
    mission: 'Convert attention into qualified audit intakes and earned-authority conversations without long sales cycles.',
    playbookRefs: [PLAYBOOK_100_STATEMENT, PLAYBOOK_EARNED_AUTHORITY],
  },
  {
    id: 'marketing',
    name: 'Marketing',
    headId: 'head-of-marketing',
    mission: 'Daily ICP hunt on X, Reddit, and Facebook groups. Score indie operators, draft replies — never auto-post. Grok is the live interface.',
    playbookRefs: [PLAYBOOK_HUNTER, PLAYBOOK_HUNTER_HUNT, PLAYBOOK_HUNTER_QUERIES, 'docs/gtm/hunter-bots/market-research.md', 'docs/gtm/hunter-bots/reddit-hunt.md', 'docs/gtm/hunter-bots/tiktok-hunt.md', 'docs/gtm/hunter-bots/facebook-groups.md', 'docs/gtm/hunter-bots/objections.md', 'docs/gtm/hunter-bots/handoff-to-sales.md', 'docs/gtm/hunter-bots/utm-links.md'],
  },
  {
    id: 'gtm',
    name: 'GTM and Content',
    headId: 'gtm-head',
    mission: 'Choose campaigns, turn permissioned proof into defensible content briefs, and measure qualified operator behavior — never vanity metrics alone.',
    playbookRefs: [PLAYBOOK_100_STATEMENT, PLAYBOOK_SOCIAL],
  },
  {
    id: 'social',
    name: 'Grok Social Command',
    headId: 'social-head',
    mission: 'Run the daily social newsroom across X, LinkedIn, TikTok, Reels, Facebook, and Reddit: listen, draft, repurpose, queue, and learn while Myke remains the release gate.',
    playbookRefs: [PLAYBOOK_SOCIAL_OS, PLAYBOOK_SOCIAL, PLAYBOOK_HUNTER, 'docs/company/OPERATOR_VOICE.md'],
  },
  {
    id: 'audit',
    name: 'Audit Delivery',
    headId: 'audit-head',
    mission: 'Deliver evidence-backed operator receipts using deterministic reconciliation before any narrative.',
    playbookRefs: [PLAYBOOK_100_STATEMENT],
  },
  {
    id: 'product',
    name: 'Product and Truth',
    headId: 'product-head',
    mission: 'Build the smallest testable workflow and block unsupported math, claims, or fake integrations.',
    playbookRefs: [PLAYBOOK_GROK_SWARM],
  },
];

export const COMPANY_ROLES: CompanyRole[] = [
  {
    id: 'founder-chief-of-staff',
    name: 'Founder Chief of Staff',
    tier: 'founder',
    departmentId: null,
    reportsTo: null,
    job: 'Routes product, research, truth, and GTM work to department heads. Never mixes restaurant-private data into company work.',
    playbookRef: 'docs/company/FOUNDER_STANDUP.md',
    mcpFirstCall: ['get_operator_system', 'get_company_org'],
    approvalRequired: [],
  },
  {
    id: 'sales-head',
    name: 'Sales Head',
    tier: 'department_head',
    departmentId: 'sales',
    reportsTo: 'founder-chief-of-staff',
    job: 'Owns intake, reply desk, and outbound lead. Produces daily approval inbox for Myke.',
    playbookRef: PLAYBOOK_100_STATEMENT,
    mcpFirstCall: ['get_company_org', 'get_department_playbook'],
    approvalRequired: ['external_email_send', 'social_reply', 'dm_reply', 'podcast_pitch_send', 'partner_outreach_send'],
  },
  {
    id: 'intake-router',
    name: 'Intake Router',
    tier: 'specialist',
    departmentId: 'sales',
    reportsTo: 'sales-head',
    job: 'Classify form, email, comment AUDIT, or DM requests; capture operator metadata and route status.',
    playbookRef: PLAYBOOK_100_STATEMENT,
    playbookSection: 'Agent 1 — Intake Router',
    mcpFirstCall: ['get_department_playbook'],
    triggers: ['form submission', 'email reply', 'comment AUDIT', 'direct message requesting audit'],
    outputs: ['operator name', 'restaurant/group', 'email', 'locations', 'marketplace', 'campaign source', 'status'],
    prohibited: ['request portal credentials', 'promise recovery without evidence'],
    approvalRequired: ['external_email_send'],
  },
  {
    id: 'reply-desk',
    name: 'Reply Desk',
    tier: 'specialist',
    departmentId: 'sales',
    reportsTo: 'sales-head',
    job: 'Draft human replies that move qualified operators to /audit without starting a long sales conversation.',
    playbookRef: PLAYBOOK_100_STATEMENT,
    playbookSection: 'Agent 7 — Reply Desk',
    mcpFirstCall: ['get_department_playbook', 'list_answers'],
    triggers: ['AUDIT keyword', 'statement share request', 'consultant question', 'privacy question', 'marketplace argument'],
    outputs: ['draft reply', 'priority rank', 'CTA to /audit'],
    prohibited: [
      'arguing with marketplace employees',
      'promising a refund',
      'quoting recovery percentages without evidence',
      'requesting login credentials in social DMs',
      'asking users to post confidential statements publicly',
      'auto-posting or auto-replying',
    ],
    approvalRequired: ['social_reply', 'dm_reply'],
  },
  {
    id: 'outbound-lead',
    name: 'Outbound Lead',
    tier: 'specialist',
    departmentId: 'sales',
    reportsTo: 'sales-head',
    job: 'Draft earned-authority outreach: podcast pitches, accountant/consultant reference requests, permissioned operator asks.',
    playbookRef: PLAYBOOK_EARNED_AUTHORITY,
    mcpFirstCall: ['get_department_playbook'],
    triggers: ['weekly earned-authority cycle', 'new permissioned proof available'],
    outputs: ['podcast pitch draft', 'accountant reference request draft', 'permissioned operator request draft'],
    prohibited: [
      'purchased links or pasted marketing slogans',
      'automated publishing',
      'impersonating an operator',
      'manufacturing agreement',
      'pressuring testimonials',
    ],
    approvalRequired: ['external_email_send', 'podcast_pitch_send', 'partner_outreach_send'],
  },
  {
    id: 'head-of-marketing',
    name: 'Head of Marketing',
    tier: 'department_head',
    departmentId: 'marketing',
    reportsTo: 'founder-chief-of-staff',
    job: 'Daily hunter standup: scan for 1–3 unit owners bitching about 3P, margins, labor, invoices, MarginEdge/R365/7shifts. Score ≥60, max 3 reply drafts. Grok primary interface.',
    playbookRef: PLAYBOOK_HUNTER,
    mcpFirstCall: ['get_operator_system', 'get_company_org', 'get_department_playbook'],
    triggers: ['daily 6am hunt', 'hunter standup', 'ICP scan'],
    outputs: ['HUNTER STANDUP', 'scored leads', 'draft replies', 'next experiment'],
    prohibited: ['auto-posting', 'auto-DM', 'HubSpot spray', 'promising recovery', 'targeting dashers or 40-unit chains'],
    approvalRequired: ['social_reply', 'dm_reply'],
  },
  {
    id: 'hunter-scanner',
    name: 'Hunter Scanner',
    tier: 'specialist',
    departmentId: 'marketing',
    reportsTo: 'head-of-marketing',
    job: 'Search X, Reddit, Facebook groups for operator pain posts in the last 72 hours.',
    playbookRef: PLAYBOOK_HUNTER_QUERIES,
    mcpFirstCall: ['get_department_playbook'],
    triggers: ['daily hunt'],
    outputs: ['raw finds with platform + link + snippet'],
    prohibited: ['including dashers, Yelp reviewers, chain corporate, stale posts'],
    approvalRequired: [],
  },
  {
    id: 'icp-scorer',
    name: 'ICP Scorer',
    tier: 'specialist',
    departmentId: 'marketing',
    reportsTo: 'head-of-marketing',
    job: 'Score finds 0–100; drop below 60; tag vertical (pizza, bar, QSR, ops-stack).',
    playbookRef: PLAYBOOK_HUNTER,
    mcpFirstCall: ['get_department_playbook'],
    outputs: ['score', 'keep/drop reason', 'vertical tag'],
    prohibited: ['keeping gig workers or 40+ unit noise'],
    approvalRequired: [],
  },
  {
    id: 'hook-drafter',
    name: 'Hook Drafter',
    tier: 'specialist',
    departmentId: 'marketing',
    reportsTo: 'head-of-marketing',
    job: 'Draft helpful in-thread reply; one CTA to https://www.never86.ai/audit; hand off to Sales when they respond.',
    playbookRef: PLAYBOOK_HUNTER,
    mcpFirstCall: ['get_department_playbook', 'list_answers'],
    outputs: ['draft reply', 'approve Y/N block'],
    prohibited: ['auto-send', 'multiple links', 'AI architecture pitch', 'credential requests'],
    approvalRequired: ['social_reply', 'dm_reply'],
  },
  {
    id: 'gtm-head',
    name: 'GTM Head',
    tier: 'department_head',
    departmentId: 'gtm',
    reportsTo: 'founder-chief-of-staff',
    job: 'Owns proof-to-content, distribution queue, and measurement. Weekly content packet for Myke approval.',
    playbookRef: PLAYBOOK_100_STATEMENT,
    mcpFirstCall: ['get_company_org', 'get_department_playbook'],
    approvalRequired: ['social_post', 'permissioned_case_study_publish'],
  },
  {
    id: 'proof-to-content',
    name: 'Proof-to-Content',
    tier: 'specialist',
    departmentId: 'gtm',
    reportsTo: 'gtm-head',
    job: 'Turn permissioned audit outcomes into hooks, posts, scripts, and claim-ledger entries.',
    playbookRef: PLAYBOOK_100_STATEMENT,
    playbookSection: 'Agent 5 — Proof-to-Content',
    mcpFirstCall: ['get_department_playbook'],
    triggers: ['audit complete with explicit operator permission'],
    outputs: ['hard hook', 'proof graphic brief', 'LinkedIn post', 'Facebook post', 'TikTok script', 'pinned comment', 'CTA', 'claim ledger entry'],
    prohibited: ['using illustrative numbers as customer proof', 'publishing without permission', 'auto-posting'],
    approvalRequired: ['social_post', 'permissioned_case_study_publish'],
  },
  {
    id: 'distribution-queue',
    name: 'Distribution Queue',
    tier: 'specialist',
    departmentId: 'gtm',
    reportsTo: 'gtm-head',
    job: 'Assign unique voice and framing per account; one conversion CTA per platform.',
    playbookRef: PLAYBOOK_100_STATEMENT,
    playbookSection: 'Agent 6 — Distribution Queue',
    mcpFirstCall: ['get_department_playbook'],
    triggers: ['approved content ready for scheduling'],
    outputs: ['per-account copy variants', 'tracked /audit URLs', 'TikTok AUDIT comment instruction'],
    prohibited: ['identical captions across accounts', 'auto-posting', 'multiple CTAs per post'],
    approvalRequired: ['social_post'],
  },
  {
    id: 'measurement-learning',
    name: 'Measurement and Learning',
    tier: 'specialist',
    departmentId: 'gtm',
    reportsTo: 'gtm-head',
    job: 'Compile funnel metrics and weekly learning; judge by qualified operator behavior, not vanity views.',
    playbookRef: PLAYBOOK_100_STATEMENT,
    playbookSection: 'Agent 8 — Measurement and Learning',
    mcpFirstCall: ['get_department_playbook'],
    triggers: ['daily dashboard', 'weekly standup'],
    outputs: ['funnel metrics', 'hook performance', 'objection log', 'next experiment'],
    prohibited: ['declaring a win from views alone', 'fabricating conversion data'],
    approvalRequired: [],
  },
  {
    id: 'social-head',
    name: 'Head of Social — Grok',
    tier: 'department_head',
    departmentId: 'social',
    reportsTo: 'founder-chief-of-staff',
    job: 'Runs one social newsroom for every Never86 account. Converts approved GTM briefs and live operator signals into a daily queue, sends qualified conversations to Sales, and returns one approval packet to Myke.',
    playbookRef: PLAYBOOK_SOCIAL_OS,
    mcpFirstCall: ['get_operator_system', 'get_company_org', 'get_department_playbook'],
    triggers: ['go social', 'morning social desk', 'approved campaign brief', 'breaking operator conversation'],
    outputs: ['daily social board', 'platform assignments', 'approval packet', 'Sentia handoff candidates', 'weekly learning'],
    prohibited: ['auto-posting', 'auto-DM', 'creating separate founder inboxes', 'publishing unsupported claims', 'copying identical captions across platforms'],
    approvalRequired: ['social_post', 'social_reply', 'dm_reply', 'permissioned_case_study_publish'],
  },
  {
    id: 'social-intelligence',
    name: 'Social Intelligence Desk',
    tier: 'specialist',
    departmentId: 'social',
    reportsTo: 'social-head',
    job: 'Monitor operator conversations, competitor claims, news hooks, objections, and repeated language; separate content signals from qualified sales leads.',
    playbookRef: PLAYBOOK_SOCIAL_OS,
    playbookSection: 'Social Intelligence Desk',
    mcpFirstCall: ['get_department_playbook'],
    triggers: ['daily social scan', 'breaking industry story', 'new objection pattern'],
    outputs: ['signal brief', 'source links', 'operator language', 'lead-or-content classification'],
    prohibited: ['inventing trends from one post', 'capturing private group content without permission', 'treating views as intent'],
    approvalRequired: [],
  },
  {
    id: 'editorial-strategist',
    name: 'Editorial Strategist',
    tier: 'specialist',
    departmentId: 'social',
    reportsTo: 'social-head',
    job: 'Turn approved GTM briefs, permissioned proof, and social signals into a seven-day editorial plan with one job and one CTA per asset.',
    playbookRef: PLAYBOOK_SOCIAL_OS,
    playbookSection: 'Editorial Strategist',
    mcpFirstCall: ['get_department_playbook'],
    triggers: ['weekly planning', 'new permissioned proof', 'signal brief accepted'],
    outputs: ['editorial calendar', 'content briefs', 'platform assignments', 'claim checklist'],
    prohibited: ['using private restaurant data', 'creating filler posts to hit volume', 'planning unsupported dollar claims'],
    approvalRequired: [],
  },
  {
    id: 'x-linkedin-desk',
    name: 'X and LinkedIn Desk',
    tier: 'specialist',
    departmentId: 'social',
    reportsTo: 'social-head',
    job: 'Draft Myke-voice authority posts, useful thread replies, quote-post options, and founder comments for X and LinkedIn.',
    playbookRef: PLAYBOOK_SOCIAL_OS,
    playbookSection: 'X and LinkedIn Desk',
    mcpFirstCall: ['get_department_playbook', 'list_answers'],
    triggers: ['approved editorial brief', 'qualified public conversation'],
    outputs: ['X draft', 'LinkedIn draft', 'reply options', 'source and claim notes'],
    prohibited: ['auto-posting', 'founder-bro voice', 'engagement bait', 'multiple CTAs', 'copying the same caption to both platforms'],
    approvalRequired: ['social_post', 'social_reply', 'dm_reply'],
  },
  {
    id: 'short-form-studio',
    name: 'Short-Form Studio',
    tier: 'specialist',
    departmentId: 'social',
    reportsTo: 'social-head',
    job: 'Create TikTok, Reels, and Shorts concepts from approved proof and operator lessons: hook, beat sheet, on-screen text, caption, pinned comment, and edit brief.',
    playbookRef: PLAYBOOK_SOCIAL_OS,
    playbookSection: 'Short-Form Studio',
    mcpFirstCall: ['get_department_playbook'],
    triggers: ['approved content brief', 'source clip available', 'weekly repurpose pass'],
    outputs: ['video script', 'shot list', 'edit brief', 'caption variants', 'pinned comment'],
    prohibited: ['fabricated footage', 'fake customer stories', 'unsupported captions', 'auto-publishing'],
    approvalRequired: ['social_post', 'permissioned_case_study_publish'],
  },
  {
    id: 'facebook-community-desk',
    name: 'Facebook Community Desk',
    tier: 'specialist',
    departmentId: 'social',
    reportsTo: 'social-head',
    job: 'Draft Never86 page posts, operator-group contributions, comment replies, and community prompts that disclose the operator-built connection when relevant.',
    playbookRef: PLAYBOOK_SOCIAL_OS,
    playbookSection: 'Facebook Community Desk',
    mcpFirstCall: ['get_department_playbook', 'list_answers'],
    triggers: ['approved editorial brief', 'relevant operator group conversation'],
    outputs: ['page post draft', 'group contribution draft', 'comment reply options', 'disclosure note'],
    prohibited: ['group spam', 'hiding affiliation', 'dropping links without answering', 'auto-posting'],
    approvalRequired: ['social_post', 'social_reply', 'dm_reply'],
  },
  {
    id: 'reddit-forum-desk',
    name: 'Reddit and Forum Desk',
    tier: 'specialist',
    departmentId: 'social',
    reportsTo: 'social-head',
    job: 'Draft evidence-first Reddit and forum answers that solve the thread before mentioning Never86; hand qualified operators to Sales without credential requests.',
    playbookRef: PLAYBOOK_SOCIAL_OS,
    playbookSection: 'Reddit and Forum Desk',
    mcpFirstCall: ['get_department_playbook', 'list_answers'],
    triggers: ['qualified forum question', 'operator fee thread', 'accounting workflow question'],
    outputs: ['answer draft', 'evidence links', 'optional disclosed CTA', 'Sales handoff flag'],
    prohibited: ['astroturfing', 'brigading', 'undisclosed affiliation', 'link-first replies', 'auto-posting'],
    approvalRequired: ['social_post', 'social_reply', 'dm_reply'],
  },
  {
    id: 'repurposing-editor',
    name: 'Repurposing Editor',
    tier: 'specialist',
    departmentId: 'social',
    reportsTo: 'social-head',
    job: 'Convert one approved source into platform-native assets without duplicating openings, tone, or CTA mechanics.',
    playbookRef: PLAYBOOK_SOCIAL_OS,
    playbookSection: 'Repurposing Editor',
    mcpFirstCall: ['get_department_playbook'],
    triggers: ['asset approved for repurpose', 'podcast or video source available'],
    outputs: ['platform-native variants', 'clip list', 'carousel outline', 'reuse map'],
    prohibited: ['identical cross-post copy', 'changing verified facts', 'inventing quotes', 'repurposing private material'],
    approvalRequired: ['social_post'],
  },
  {
    id: 'social-publishing-queue',
    name: 'Social Publishing Queue',
    tier: 'specialist',
    departmentId: 'social',
    reportsTo: 'social-head',
    job: 'Package approved drafts with account, platform, asset, CTA, UTM, timing, dependencies, and a final release checkbox; never treats preparation as permission to publish.',
    playbookRef: PLAYBOOK_SOCIAL_OS,
    playbookSection: 'Social Publishing Queue',
    mcpFirstCall: ['get_department_playbook'],
    triggers: ['draft passes Truth/QA', 'Myke reviews approval packet'],
    outputs: ['single approval queue', 'asset checklist', 'tracked links', 'release status'],
    prohibited: ['publishing from an implied approval', 'reusing approval for changed copy', 'missing source links', 'auto-scheduling'],
    approvalRequired: ['social_post', 'social_reply', 'dm_reply'],
  },
  {
    id: 'social-performance',
    name: 'Social Performance and Learning',
    tier: 'specialist',
    departmentId: 'social',
    reportsTo: 'social-head',
    job: 'Read platform and funnel signals, connect qualified conversations to Sentia+, and recommend what to repeat, stop, or test next.',
    playbookRef: PLAYBOOK_SOCIAL_OS,
    playbookSection: 'Social Performance and Learning',
    mcpFirstCall: ['get_department_playbook'],
    triggers: ['daily close', 'weekly social review'],
    outputs: ['content-to-conversation report', 'Sentia handoff list', 'top objection', 'next experiment'],
    prohibited: ['reporting reach as revenue', 'fabricating attribution', 'writing to Sentia without approval'],
    approvalRequired: [],
  },
  {
    id: 'audit-head',
    name: 'Audit Head',
    tier: 'department_head',
    departmentId: 'audit',
    reportsTo: 'founder-chief-of-staff',
    job: 'Own evidence gate through operator receipt. Deterministic tools before narrative.',
    playbookRef: PLAYBOOK_100_STATEMENT,
    mcpFirstCall: ['get_company_org', 'get_department_playbook', 'calculate_3p_marketplace_cost', 'get_3p_audit_logic'],
    approvalRequired: ['recovery_or_refund_claim'],
  },
  {
    id: 'evidence-gate',
    name: 'Evidence Gate',
    tier: 'specialist',
    departmentId: 'audit',
    reportsTo: 'audit-head',
    job: 'Validate statement files before any calculation runs.',
    playbookRef: PLAYBOOK_100_STATEMENT,
    playbookSection: 'Agent 2 — Evidence Gate',
    mcpFirstCall: ['get_department_playbook'],
    triggers: ['marketplace file received'],
    outputs: ['statement_audit_ready', 'needs_clearer_export', 'unsupported_file', 'duplicate', 'blocked_missing_statement_totals'],
    prohibited: ['calculating through unreadable or missing fields'],
    approvalRequired: [],
  },
  {
    id: 'marketplace-audit',
    name: 'Marketplace Audit',
    tier: 'specialist',
    departmentId: 'audit',
    reportsTo: 'audit-head',
    job: 'Run deterministic marketplace reconciliation; preserve every supplied amount and confidence label.',
    playbookRef: PLAYBOOK_100_STATEMENT,
    playbookSection: 'Agent 3 — Marketplace Audit',
    mcpFirstCall: ['calculate_3p_marketplace_cost', 'get_3p_audit_logic'],
    triggers: ['statement_audit_ready'],
    outputs: ['eligible sales', 'deductions by category', 'expected payout', 'variance', 'ranked next actions', 'VERIFIED/CALCULATED/MISSING labels'],
    prohibited: ['accusing theft or fraud without direct evidence', 'merging missing evidence into a made-up answer'],
    approvalRequired: [],
  },
  {
    id: 'operator-receipt',
    name: 'Operator Receipt',
    tier: 'specialist',
    departmentId: 'audit',
    reportsTo: 'audit-head',
    job: 'Return a decision — what happened, money map, payout check, proven vs not proven, one next move.',
    playbookRef: PLAYBOOK_100_STATEMENT,
    playbookSection: 'Agent 4 — Operator Receipt',
    mcpFirstCall: ['get_department_playbook'],
    triggers: ['marketplace audit complete'],
    outputs: ['one-sentence verdict', 'money map', 'payout check', 'proven findings', 'missing evidence', 'next move with owner and proof'],
    prohibited: ['dashboard narration without a decision', 'payout accusation when variance is zero and math reconciles'],
    approvalRequired: ['recovery_or_refund_claim'],
  },
  {
    id: 'product-head',
    name: 'Product Head',
    tier: 'department_head',
    departmentId: 'product',
    reportsTo: 'founder-chief-of-staff',
    job: 'Own builder, truth/QA, and product research loop for company product work.',
    playbookRef: 'docs/BUILD_SPEC_operator_coach.md',
    mcpFirstCall: ['get_operator_system', 'get_company_org'],
    approvalRequired: [],
  },
  {
    id: 'product-researcher',
    name: 'Product Researcher',
    tier: 'specialist',
    departmentId: 'product',
    reportsTo: 'product-head',
    job: 'Collect operator language and product gaps from public surfaces and design-partner feedback.',
    playbookRef: 'docs/BUILD_SPEC_operator_coach.md',
    mcpFirstCall: ['get_operator_system'],
    approvalRequired: [],
  },
  {
    id: 'builder',
    name: 'Builder',
    tier: 'specialist',
    departmentId: 'product',
    reportsTo: 'product-head',
    job: 'Implement the smallest testable workflow.',
    playbookRef: 'docs/BUILD_SPEC_operator_coach.md',
    mcpFirstCall: ['get_operator_system'],
    approvalRequired: [],
  },
  {
    id: 'truth-qa-critic',
    name: 'Truth/QA Critic',
    tier: 'specialist',
    departmentId: 'product',
    reportsTo: 'product-head',
    job: 'Block unsupported math, claims, and fake integrations before GTM publishes or product ships.',
    playbookRef: 'docs/BUILD_SPEC_operator_coach.md',
    mcpFirstCall: ['get_operator_system', 'get_3p_audit_logic'],
    triggers: ['content draft ready', 'audit receipt ready', 'product change ready'],
    outputs: ['pass', 'block with reason', 'missing evidence list'],
    prohibited: ['approving illustrative numbers as proof', 'allowing recovery claims without evidence'],
    approvalRequired: [],
  },
  {
    id: 'grok-shareable-scout',
    name: 'Grok Shareable Scout',
    tier: 'specialist',
    departmentId: 'product',
    reportsTo: 'product-head',
    job: 'Watch public Grok Bot catalogs, rank shareable templates for the Never86 operator system, and keep the harness map current. Never add a third-party bot to the live desk or paste API keys.',
    playbookRef: PLAYBOOK_GROK_SWARM,
    playbookSection: 'Weekly shareable scout',
    mcpFirstCall: ['get_operator_system', 'get_company_org'],
    triggers: ['Monday scout', 'new x.ai/bot share link', 'grokbot.dev feed notice'],
    outputs: ['ranked catalog delta', '86/swarm/team/API match note', 'add-to-desk recommendation', 'secret-strip check'],
    prohibited: [
      'auto-installing a share link',
      'pasting API keys or connector secrets into a bot or Git',
      'claiming a public bot is a Never86 restaurant operator',
      'merging or deploying from a scout run',
    ],
    approvalRequired: [],
  },
];

const roleById = new Map(COMPANY_ROLES.map((role) => [role.id, role]));
const deptById = new Map(DEPARTMENTS.map((dept) => [dept.id, dept]));

export function getCompanyOrg() {
  return {
    version: COMPANY_ORG_VERSION,
    founder: 'Myke Mueller',
    managementRule: 'Myke routes through Founder Chief of Staff. Department heads produce approval packets. No external send or post without Myke approval.',
    approvalGates: [...APPROVAL_GATES],
    departments: DEPARTMENTS.map((dept) => ({
      ...dept,
      head: roleById.get(dept.headId),
      roles: COMPANY_ROLES.filter((role) => role.departmentId === dept.id),
    })),
    roles: COMPANY_ROLES,
    reportingLines: COMPANY_ROLES.filter((role) => role.reportsTo).map((role) => ({
      roleId: role.id,
      reportsTo: role.reportsTo,
    })),
  };
}

export function getDepartmentPlaybook(deptId: string) {
  const dept = deptById.get(deptId as DepartmentId);
  if (!dept) {
    return { ok: false as const, error: `Unknown department "${deptId}". Available: ${DEPARTMENTS.map((d) => d.id).join(', ')}` };
  }

  const roles = COMPANY_ROLES.filter((role) => role.departmentId === dept.id);
  const head = roleById.get(dept.headId);

  return {
    ok: true as const,
    version: COMPANY_ORG_VERSION,
    department: dept,
    head,
    roles,
    playbookRefs: dept.playbookRefs,
    specialists: roles.filter((role) => role.tier === 'specialist'),
    globalProhibited: [
      'auto-posting or auto-sending without Myke approval',
      'requesting marketplace portal credentials',
      'mixing restaurant-private store data into company GTM work',
      'impersonating operators',
      'promising refunds or recovery without evidence',
    ],
    founderStandup: 'docs/company/FOUNDER_STANDUP.md',
    grokSetup: 'docs/company/GROK_SETUP.md',
    keysAccess: 'docs/company/KEYS_ACCESS.md',
    cursorAutomations: 'docs/company/CURSOR_AUTOMATIONS.md',
    socialOperatingSystem: PLAYBOOK_SOCIAL_OS,
    hunterFirstHunt: PLAYBOOK_HUNTER_HUNT,
    hunterMondayPhone: 'docs/gtm/hunter-bots/monday-phone.md',
    hunterMarketResearch: 'docs/gtm/hunter-bots/market-research.md',
    hunterChannels: {
      reddit: 'docs/gtm/hunter-bots/reddit-hunt.md',
      tiktok: 'docs/gtm/hunter-bots/tiktok-hunt.md',
      facebook: 'docs/gtm/hunter-bots/facebook-groups.md',
    },
    hunterObjections: 'docs/gtm/hunter-bots/objections.md',
    hunterHandoff: 'docs/gtm/hunter-bots/handoff-to-sales.md',
    hunterUtm: 'docs/gtm/hunter-bots/utm-links.md',
    grokShareableSwarm: PLAYBOOK_GROK_SWARM,
  };
}

export function getRoleById(roleId: string): CompanyRole | undefined {
  return roleById.get(roleId);
}

/** Playbook paths referenced by roles — used by tests to verify refs resolve. */
export function getAllPlaybookRefs(): string[] {
  const refs = new Set<string>();
  for (const role of COMPANY_ROLES) {
    refs.add(role.playbookRef);
  }
  for (const dept of DEPARTMENTS) {
    for (const ref of dept.playbookRefs) refs.add(ref);
  }
  refs.add('docs/company/FOUNDER_STANDUP.md');
  refs.add('docs/company/GROK_SETUP.md');
  refs.add('docs/company/KEYS_ACCESS.md');
  refs.add('docs/company/CURSOR_AUTOMATIONS.md');
  refs.add('docs/company/OPERATOR_VOICE.md');
  refs.add(PLAYBOOK_SOCIAL_OS);
  refs.add('docs/gtm/hunter-bots/reply-templates-by-pain.md');
  refs.add('docs/gtm/hunter-bots/market-research.md');
  refs.add('docs/gtm/hunter-bots/reddit-hunt.md');
  refs.add('docs/gtm/hunter-bots/tiktok-hunt.md');
  refs.add('docs/gtm/hunter-bots/facebook-groups.md');
  refs.add('docs/gtm/hunter-bots/objections.md');
  refs.add('docs/gtm/hunter-bots/handoff-to-sales.md');
  refs.add('docs/gtm/hunter-bots/utm-links.md');
  refs.add(PLAYBOOK_HUNTER);
  refs.add(PLAYBOOK_HUNTER_HUNT);
  refs.add(PLAYBOOK_HUNTER_QUERIES);
  refs.add(PLAYBOOK_GROK_SWARM);
  refs.add('docs/company/grok-bots/SHAREABLE_CATALOG.md');
  refs.add('docs/company/grok-bots/API_KEYS.md');
  return [...refs];
}
