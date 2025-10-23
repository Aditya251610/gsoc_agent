export const DEFAULT_SKILLS = [
  "Python", "FastAPI", "Next.js", "React", "TypeScript", "Tailwind", "shadcn/ui"
];

export const DEFAULT_LANGUAGES = ["Python", "JavaScript", "TypeScript"];

// search window + quality threshold
export const UPDATED_SINCE = "2024-01-01";
export const MIN_STARS = 5;

// ranking thresholds
export const RELEVANT_THRESHOLD = 60;   // "relevant" if score >= 60
export const CANDIDATE_THRESHOLD = 60;  // strict mode: keep only >= 60

// batching
export const BATCH = 20;                // process 50 repos per LLM request
export const MAX_RESULTS = 300;         // GitHub Search API cap per query

// logging
export const SHOW_PROGRESS = true;      // show batch progress
export const LOG_ONLY_SUMMARY = false;  // still print the end summary

// email (one email only if inserted > 0)
export const EMAIL_ON_INSERT = true;
