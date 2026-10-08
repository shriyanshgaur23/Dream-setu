import { z } from "zod";

export const NODE_TYPES = ["skill", "role", "cert", "project", "milestone"] as const;

// Lenient helpers: trim or fix small AI mistakes instead of rejecting the whole reply.
const str = (max: number) =>
  z.preprocess((v) => (v == null ? "" : String(v)), z.string().transform((s) => s.trim().slice(0, max)));
const strList = (n: number, m: number) =>
  z.preprocess(
    (v) => (Array.isArray(v) ? v.slice(0, n).map((x) => String(x).slice(0, m)) : []),
    z.array(z.string()),
  );

const NodeSchema = z.object({
  id: str(60).refine((s) => s.length > 0),
  label: str(80).refine((s) => s.length > 0),
  phase: z.coerce.number().catch(0).transform((n) => Math.min(4, Math.max(0, Math.round(n)))),
  type: z.enum(NODE_TYPES).catch("skill"),
  weeks: z.coerce.number().min(1).max(104).catch(2),
  desc: str(500),
  requires: z.preprocess((v) => (Array.isArray(v) ? v.map((x) => String(x)) : []), z.array(z.string())),
});

const PathSchema = z.object({
  who: str(120),
  journey: strList(8, 80),
  tip: str(300),
});

const phaseName = (v: unknown) => {
  if (v && typeof v === "object") {
    const o = v as Record<string, unknown>;
    return String(o.name ?? o.title ?? "");
  }
  return String(v ?? "");
};

export const RoadmapSchema = z.object({
  title: str(140).refine((s) => s.length > 0),
  summary: str(600),
  phases: z.preprocess(
    (v) => (Array.isArray(v) ? v.slice(0, 5).map(phaseName) : v),
    z.array(str(40)).min(2).max(5),
  ),
  nodes: z.preprocess((v) => (Array.isArray(v) ? v.slice(0, 30) : v), z.array(NodeSchema).min(5)),
  paths: z.preprocess((v) => (Array.isArray(v) ? v.slice(0, 3) : []), z.array(PathSchema).catch([])),
});

export type Roadmap = z.infer<typeof RoadmapSchema>;
export type RNode = Roadmap["nodes"][number];

export const StepSchema = z.object({
  project: z
    .object({ title: str(120), brief: str(500), steps: strList(6, 160) })
    .catch({ title: "Weekend project", brief: "", steps: [] }),
  repo: z.object({ name: str(120), why: str(300) }).catch({ name: "Search GitHub for this topic", why: "" }),
  questions: z.preprocess(
    (v) => (Array.isArray(v) ? v.slice(0, 8) : []),
    z.array(z.object({ q: str(300), hint: str(300) })).catch([]),
  ),
  resource: z.object({ title: str(120), why: str(300) }).nullable().catch(null),
});

export type StepPlan = z.infer<typeof StepSchema>;

/** Clean up AI output: unique ids, valid phases, valid prerequisites, no cycles. */
export function normalize(rm: Roadmap): Roadmap {
  const seen = new Set<string>();
  const nodes: RNode[] = [];
  for (const n of rm.nodes) {
    if (seen.has(n.id)) continue;
    seen.add(n.id);
    nodes.push({ ...n, phase: Math.min(n.phase, rm.phases.length - 1) });
  }
  const ids = new Set(nodes.map((n) => n.id));
  for (const n of nodes) {
    n.requires = Array.from(new Set(n.requires)).filter((r) => ids.has(r) && r !== n.id);
  }
  const by = new Map(nodes.map((n) => [n.id, n] as const));
  const state = new Map<string, number>();
  const dfs = (n: RNode): void => {
    state.set(n.id, 1);
    n.requires = n.requires.filter((r) => {
      const s = state.get(r);
      if (s === 1) return false; // would create a cycle
      if (s === undefined) {
        const p = by.get(r);
        if (p) dfs(p);
      }
      return true;
    });
    state.set(n.id, 2);
  };
  for (const n of nodes) if (!state.has(n.id)) dfs(n);
  return { ...rm, nodes };
}
