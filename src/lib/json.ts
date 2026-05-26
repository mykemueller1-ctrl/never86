function stripCodeFences(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return fenced ? fenced[1] : text;
}

// Models are asked to return raw JSON, but occasionally wrap it in markdown
// fences or surround it with prose. Strip fences, then fall back to the first
// balanced object before giving up.
export function parseModelJson<T = unknown>(text: string): T {
  const cleaned = stripCodeFences(text).trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start !== -1 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1)) as T;
    }
    throw new Error('Model response was not valid JSON');
  }
}
