import "dotenv/config";
import { DEFAULT_SKILLS, CANDIDATE_THRESHOLD, SHOW_PROGRESS, LOG_ONLY_SUMMARY, EMAIL_ON_INSERT } from "./config.js";
import { githubSearch } from "./tools/githubSearch.js";
import { rankProjects } from "./tools/rankProjects.js";
import { notionUpsert } from "./tools/notionUpsert.js";
import { sendInsertionEmail, buildProjectsEmail } from "./tools/emailer.js";
import type { RankedItem } from "./types.js";

async function main() {
  if (!LOG_ONLY_SUMMARY) console.log("🔎 Searching GitHub for GSOC 2025/2026 projects (Groq AI-enabled)…");

  // 1) Search GitHub (returns up to 300)
  const repos = await githubSearch();
  if (!LOG_ONLY_SUMMARY) console.log(`• Found ${repos.length} candidates from GitHub`);

  // 2) Rank in batches (BATCH=50)
  const ranked = await rankProjects(repos, DEFAULT_SKILLS);

  // Strict filter: keep only high-fit items
  const candidates: RankedItem[] = ranked.filter(r => r.score >= CANDIDATE_THRESHOLD);

  if (!LOG_ONLY_SUMMARY) {
    console.log(`• ${candidates.length} passed threshold (${CANDIDATE_THRESHOLD})`);
    console.log("• Top matches:");
    for (const t of [...candidates].sort((a,b)=>b.score-a.score).slice(0, 10)) {
      console.log(`  - [${t.score}] ${t.org}/${t.project} (${t.focus})`);
      console.log(`    ${t.repo}`);
    }
  }

  // 3) Upsert into Notion (add-only, skip if exists)
  const upsert = await notionUpsert(candidates);

  // 4) Email if inserted
  if (EMAIL_ON_INSERT && upsert.inserted > 0) {
    const insertedItems = candidates.filter(c => upsert.urls.includes(c.repo));
    const html = buildProjectsEmail(insertedItems.map(i => ({
      org: i.org, project: i.project, repo: i.repo, score: i.score, note: i.note
    })));
    try {
      const res = await sendInsertionEmail(
        `GSOC Agent: ${upsert.inserted} new project(s) added`,
        html
      );
      if ((res as any).skipped) {
        // do nothing
      }
    } catch {
      // swallow email errors for this workflow
    }
  }

  // ===== FINAL SUMMARY (always shown) =====
  const total = repos.length;
  const rankedCount = ranked.length;
  const kept = candidates.length;
  const inserted = upsert.inserted;
  const skippedExists = upsert.skippedExists;
  const filteredOut = rankedCount - kept;

  console.log("\n================== SUMMARY ==================");
  console.log(`Scanned from GitHub:     ${total}`);
  console.log(`Ranked by LLM:           ${rankedCount}`);
  console.log(`Kept (score ≥ thresh):   ${kept}`);
  console.log(`Inserted into Notion:    ${inserted}`);
  console.log(`Skipped (already exist): ${skippedExists}`);
  console.log(`Filtered out (low score):${filteredOut}`);
  console.log("============================================\n");
}

main().catch(err => {
  console.error("💥 Fatal Error:", err);
  process.exit(1);
});
