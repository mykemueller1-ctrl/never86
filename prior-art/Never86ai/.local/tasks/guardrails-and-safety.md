# Advanced Guardrails & Safety Layer

## What & Why
Strengthen the AI safety infrastructure beyond the current confidence scoring. Add content safety filtering on both inputs and outputs, human-in-the-loop escalation when the AI is uncertain, and prompt versioning so every conversation can be traced back to the exact prompt that generated it. This makes the system production-hardened and auditable.

## Done looks like
- Input messages are screened for prompt injection attempts, toxic content, and manipulation before reaching the LLM
- Output messages are screened for harmful content, PII leakage, and hallucinated financial advice before reaching the operator
- When confidence is below threshold, the system asks the operator a clarifying question or flags the response with a visible disclaimer instead of silently serving a bad answer
- Every system prompt has a version hash stored with the conversation, and prompts are stored in a versioned registry so changes can be tracked over time
- An admin view shows prompt version history and which version is currently active for each agent
- Content safety violations are logged and surfaced in the admin dashboard

## Out of scope
- Third-party content moderation APIs (build this with local logic first)
- Blocking users or banning accounts
- Legal compliance review

## Tasks
1. Build an input safety filter that checks incoming messages for prompt injection patterns (common jailbreak phrases, role-override attempts, system prompt extraction) and toxic/abusive content
2. Build an output safety filter that screens AI responses for PII (phone numbers, SSNs, emails not belonging to the operator), hallucinated specific financial numbers without data backing, and harmful operational advice
3. Implement human-in-the-loop escalation — when confidence score is below 0.5, append a visible disclaimer to the response and offer the operator a "flag this answer" button that routes to admin review
4. Create a prompt version registry — store all system prompts with version hashes, timestamps, and which agent uses them. Record the prompt version hash with every conversation
5. Build an admin endpoint to view prompt version history, compare versions, and roll back to previous versions
6. Add a content safety log table and surface violations in the existing admin dashboard

## Relevant files
- `artifacts/api-server/src/lib/quality-signals.ts`
- `artifacts/api-server/src/routes/operator-insights.ts`
- `artifacts/api-server/src/routes/chat.ts`
- `artifacts/api-server/src/routes/operator-briefing.ts`
- `lib/db/src/schema/ai-training.ts`
- `artifacts/api-server/src/lib/logger.ts`
- `artifacts/api-server/src/app.ts`
