export const EXISTING_NEVER86_ARTIFACTS = {
  publicMcp: {
    endpoint: 'https://www.never86.ai/api/mcp',
    route: 'src/app/api/mcp/route.ts',
    contract: 'src/lib/mcpPublicContract.ts',
    docsPage: 'src/app/mcp/page.tsx',
    owns: ['public tools', 'operator system pack', 'public logic', '3P quick win', 'Action Shift ranking from typed inputs'],
    auth: 'none — public read-only surface, no operator database',
  },
  operatorSystem: {
    versionSource: 'src/lib/operatorSystem.ts',
    logicSource: 'src/lib/publicOperatorLogic.ts',
    notes: 'Canonical knowledge. Shells import; they do not copy formulas.',
  },
  privateOrchestrator: {
    endpoint: 'https://www.never86.ai/api/orchestrator/mcp',
    oauth: 'src/lib/orchestratorOAuth.ts',
    wellKnown: [
      'src/app/.well-known/oauth-authorization-server/route.ts',
      'src/app/.well-known/oauth-protected-resource/route.ts',
    ],
    owns: ['Grok → Cursor factory dispatch'],
    excludedFromPublicShells: true,
    reason: 'Private Cursor launch bridge. Not restaurant-tenant MCP. Not bundled into ChatGPT/Claude/Gemini/Grok operator shells.',
  },
  tenantAndWorkforce: {
    planner: 'src/lib/actionShiftWorkforce.ts',
    migration: 'supabase/migrations/20260826005152_action_shift_workforce.sql',
    operatorAuth: 'src/lib/operatorAuth.ts',
    notes: 'Tenant isolation stays in the backend. Shells never store another store\'s rules. Live Neon/Supabase migrations are out of scope for this slice.',
  },
  actionShift: {
    engine: 'src/lib/actionShift.ts',
    desk: 'src/lib/deskClose.ts',
    screens: 'docs/product/CTAP_ACTION_SHIFT_SCREENS.md',
    notes: 'Manager proof uses verbalYesCloses=false and night checklist objects already returned by build_action_shift.',
  },
  llmDiscovery: {
    llmsTxt: 'src/app/llms.txt/route.ts',
    llmsFull: 'src/app/llms-full.txt/route.ts',
  },
  priorArtNotForked: {
    spec: 'prior-art/n86_mcp_server_spec.md',
    operatorMcp: 'prior-art/CTAP_BACKUP_2026-05-19/THE-MIGRATION-BUNDLE-Netlify-Supabase/code/routes/operator-mcp.ts',
    notes: 'Historical operator MCP. Not copied into these shells. Public MCP is the live contract.',
  },
} as const;
