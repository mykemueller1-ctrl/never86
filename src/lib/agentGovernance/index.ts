/**
 * Agent governance orchestration — connects specialists already in the repo.
 * One agent per job. Human approves memory and external sends.
 * Does not rewrite Action Shift / CSV / 3P math.
 */

export {
  listAgentJobs,
  getAgentJob,
  orchestrationRule,
  governanceLoop,
  type AgentJob,
  type AgentTeam,
} from './registry';

export {
  ALLOWED_MEMORY_TYPES,
  proposeMemoryAtom,
  approveMemoryAtom,
  supersedeMemoryAtom,
  listMemoryAtoms,
  resetStoreMemoryForTests,
  type MemoryAtom,
  type ProposeMemoryAtomInput,
} from './storeMemory';

export {
  KNOWLEDGE_TOOL_NAMES,
  MCP_RESOURCES,
  MCP_PROMPTS,
  handleGetOperatorSystem,
  handleGetOperatorLogic,
  handleGet3pAuditLogic,
  handleListAnswers,
  handleListFreeAgents,
  handleListAgentJobs,
  handleListSpecialists,
  handleGetSpecialist,
  readMcpResource,
  getMcpPrompt,
} from './knowledge';

export {
  SPECIALIST_PACKS,
  listSpecialists,
  getSpecialist,
  specialistBriefPrompt,
  type SpecialistId,
  type SpecialistPack,
} from './specialists';
