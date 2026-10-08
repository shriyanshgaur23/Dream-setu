type Msg = { role: "system" | "user" | "assistant"; content: string };

export class LlmError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/** Turn provider failures into messages a person can act on. */
export function friendlyError(e: unknown, fallback: string): string {
  if (e instanceof LlmError) {
    if (e.status === 401 || e.status === 403) return "The AI key was rejected. Check LLM_API_KEY in .env.local and restart the server.";
    if (e.status === 404) return "The AI model or URL was not found. Check LLM_MODEL and LLM_BASE_URL.";
    if (e.status === 429) return "The AI is busy right now (rate limit). Wait a minute and try again.";
    if (e.status === 400) return "The AI rejected the request. Check LLM_MODEL and set LLM_JSON_MODE=false.";
  }
  if (e instanceof Error && e.name === "AbortError") return "The AI took too long to answer. Try again.";
  return fallback;
}

export function llmConfigured(): boolean {
  const key = process.env.LLM_API_KEY || "";
  const placeholder = /^(paste|your)/i.test(key); // an unedited example value is not a real key
  return Boolean(key && process.env.LLM_BASE_URL && process.env.LLM_MODEL) && !placeholder;
}

async function call(messages: Msg[], json: boolean): Promise<string> {
  const base = (process.env.LLM_BASE_URL || "").replace(/\/$/, "");
  const body: Record<string, unknown> = {
    model: process.env.LLM_MODEL,
    messages,
    temperature: json ? 0.4 : 0.6,
  };
  if (json && process.env.LLM_JSON_MODE === "true") body.response_format = { type: "json_object" };
  if (process.env.LLM_REASONING) body.reasoning_effort = process.env.LLM_REASONING; // optional, e.g. low for gpt-oss

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 55_000);
  try {
    const res = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.LLM_API_KEY}`,
      },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    if (!res.ok) {
      const detail = (await res.text().catch(() => "")).slice(0, 300); // provider message, never contains our key
      console.error(`LLM request failed (${res.status}): ${detail}`);
      throw new LlmError(res.status, `LLM request failed with status ${res.status}`);
    }
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const text = data.choices?.[0]?.message?.content;
    if (!text) throw new Error("LLM returned an empty reply");
    return text;
  } finally {
    clearTimeout(timer);
  }
}

export function parseLoose(text: string): unknown {
  const s = text.replace(/```json|```/g, "");
  const a = s.indexOf("{");
  const b = s.lastIndexOf("}");
  if (a < 0 || b <= a) throw new Error("No JSON found in reply");
  return JSON.parse(s.slice(a, b + 1));
}

export async function askJSON(prompt: string): Promise<unknown> {
  const text = await call(
    [
      { role: "system", content: "You reply with one valid JSON object only. No markdown, no commentary." },
      { role: "user", content: prompt },
    ],
    true,
  );
  return parseLoose(text);
}

export async function askChat(messages: Msg[]): Promise<string> {
  return call(messages, false);
}
