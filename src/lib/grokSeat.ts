/**
 * Grok / xAI path inside One Seat.
 * Formulas decide. Grok explains. Fail-closed without XAI_API_KEY.
 * Not a Grok-resale product. Operators stay on never86.ai.
 */

import { XAI_API_KEY_NAME, xaiApiBase, xaiModel } from './keysAccess';

type EnvMap = Record<string, string | undefined>;

export const GROK_SEAT_ROLE = 'explain-only';
export const GROK_SEAT_BOUNDARY =
  'Grok may restate a formula result already computed on this seat. It must not invent dollars, recoveries, or missing papers.';

export type GrokSeatStatus =
  | { ready: true; model: string; baseUrl: string }
  | { ready: false; reason: 'xai_key_missing'; model: string; baseUrl: string };

export function grokSeatStatus(env: EnvMap = process.env): GrokSeatStatus {
  const model = xaiModel(env);
  const baseUrl = xaiApiBase(env);
  const key = env[XAI_API_KEY_NAME]?.trim();
  if (!key) {
    return { ready: false, reason: 'xai_key_missing', model, baseUrl };
  }
  return { ready: true, model, baseUrl };
}

export function grokSeatSystemPrompt(): string {
  return [
    'You are the explain voice inside Never86 One Seat / Action Shift.',
    'One Seat = Action Shift = Community logic for 1–5 unit independents.',
    'Deterministic formulas already decided the numbers. Do not invent dollars.',
    'A price increase is not recovered cash. Missing evidence stays Missing.',
    'Never name staff as thieves. Never ask the operator to sign in on ChatGPT.',
    'Return 2–4 short sentences: what changed, the next move, and the claim boundary.',
  ].join(' ');
}

export type GrokExplainInput = {
  fact: string;
  nextMove: string;
  claimBoundary: string;
};

export type GrokExplainResult =
  | { ok: true; text: string; model: string; source: 'grok' }
  | { ok: false; error: string; code: 'xai_key_missing' | 'xai_http' | 'xai_empty' };

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export async function explainWithGrok(
  input: GrokExplainInput,
  env: EnvMap = process.env,
  fetchFn: FetchLike = fetch,
): Promise<GrokExplainResult> {
  const status = grokSeatStatus(env);
  const key = env[XAI_API_KEY_NAME]?.trim();
  if (!status.ready || !key) {
    return {
      ok: false,
      code: 'xai_key_missing',
      error: 'XAI_API_KEY is not set. The formula result still stands. Grok explanation stays off.',
    };
  }

  const response = await fetchFn(`${status.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: status.model,
      temperature: 0.2,
      max_tokens: 220,
      messages: [
        { role: 'system', content: grokSeatSystemPrompt() },
        {
          role: 'user',
          content: `FACT: ${input.fact}\nNEXT MOVE: ${input.nextMove}\nBOUNDARY: ${input.claimBoundary}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    return {
      ok: false,
      code: 'xai_http',
      error: `xAI chat-completions returned HTTP ${response.status}. Formula result unchanged.`,
    };
  }

  const body = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const text = body.choices?.[0]?.message?.content?.trim();
  if (!text) {
    return { ok: false, code: 'xai_empty', error: 'xAI returned no explanation. Formula result unchanged.' };
  }
  return { ok: true, text, model: status.model, source: 'grok' };
}

export function fallbackExplain(input: GrokExplainInput): string {
  return `${input.fact} ${input.nextMove} ${input.claimBoundary}`;
}
