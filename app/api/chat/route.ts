import { NextResponse } from "next/server";
import { allow } from "@/lib/guard";
import { askChat, llmConfigured } from "@/lib/llm";
import { offlineChat } from "@/lib/offline";
import { buildChatSystem, cleanContext } from "@/lib/prompts";

export const maxDuration = 60;

export async function POST(req: Request) {
  if (!allow(req, 150)) {
    return NextResponse.json({ error: "Too many messages. Please wait a few minutes." }, { status: 429 });
  }
  const body = (await req.json().catch(() => null)) as { messages?: unknown; context?: unknown } | null;
  if (!body || !Array.isArray(body.messages)) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const history = (body.messages as unknown[])
    .slice(-10)
    .map((m) => {
      const r = (m && typeof m === "object" ? m : {}) as Record<string, unknown>;
      return {
        role: r.role === "assistant" ? ("assistant" as const) : ("user" as const),
        content: String(r.content ?? "").slice(0, 600),
      };
    })
    .filter((m) => m.content);
  while (history.length && history[0].role !== "user") history.shift();
  if (!history.length) return NextResponse.json({ error: "Ask a question first." }, { status: 400 });

  const ctx = cleanContext(body.context);
  const lastUser = history[history.length - 1].content;
  if (!llmConfigured()) return NextResponse.json({ demo: true, reply: offlineChat(lastUser, ctx) });

  try {
    const reply = await askChat([{ role: "system", content: buildChatSystem(ctx) }, ...history]);
    return NextResponse.json({ demo: false, reply });
  } catch (e) {
    console.error("chat error:", e instanceof Error ? e.message : e);
    return NextResponse.json({ demo: true, reply: offlineChat(lastUser, ctx) });
  }
}
