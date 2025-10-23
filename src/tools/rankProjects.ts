import Groq from "groq-sdk";
import type { ProjectItem, RankedItem } from "../types.js";
import { BATCH, RELEVANT_THRESHOLD, SHOW_PROGRESS } from "../config.js";

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function rankProjects(all: ProjectItem[], skills: string[]) {
  if (!all.length) return [] as RankedItem[];

  const batches: RankedItem[] = [];
  const total = all.length;
  const totalBatches = Math.ceil(total / BATCH);

  for (let i = 0; i < total; i += BATCH) {
    const batchIndex = Math.floor(i / BATCH) + 1;
    const batch = all.slice(i, i + BATCH);

    if (SHOW_PROGRESS) {
      const start = i + 1;
      const end = Math.min(i + BATCH, total);
      console.log(`🔄 Ranking batch ${batchIndex} of ${totalBatches} (repos ${start}–${end})`);
    }

    const sys = [
      `You are ranking GitHub repos for GSOC-fit.`,
      `Candidate skills: ${skills.join(", ")}.`,
      `Return a JSON array with exactly ${batch.length} objects.`,
      `Each object: {"score":0-100,"focus":"Backend|Frontend|Infra|AI|DevRel|Tooling|Docs","tech":[3-8 strings],"note":"one-line tip"}.`,
      `Score higher if relevant to FastAPI, Python, Next.js, React, TypeScript, Tailwind, shadcn/ui.`,
      `Do not include any prose, only JSON array.`
    ].join(" ");

    const user = JSON.stringify(batch, null, 2);

    const resp = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0.2,
      messages: [
        { role: "system", content: sys },
        { role: "user", content: user }
      ]
    });

    let parsed: any[] = [];
    try {
      parsed = JSON.parse(resp.choices[0]?.message?.content || "[]");
      if (!Array.isArray(parsed)) parsed = [];
    } catch {
      parsed = [];
    }

    // align AI results with batch order
    for (let j = 0; j < batch.length; j++) {
      const base = batch[j];
      const ai = parsed[j] || {};
      const item: RankedItem = {
        ...base,
        score: Number(ai.score ?? 0),
        focus: ai.focus ?? "Tooling",
        tech: Array.isArray(ai.tech) ? ai.tech : [],
        note: typeof ai.note === "string" ? ai.note : "",
        isRelevant: Number(ai.score ?? 0) >= RELEVANT_THRESHOLD
      };
      batches.push(item);
    }

    if (SHOW_PROGRESS) {
      console.log(`✅ Done (${batch.length} ranked)\n`);
    }
  }

  return batches;
}
