# GSOC Agent — Open-source Project Finder

A tiny Node.js/TypeScript agent that searches GitHub for potential GSOC (Google Summer of Code) and open-source contributor projects, ranks them with a Groq/LLM model, and upserts high-fit candidates into a Notion database. It can also send an email alert when new items are inserted.

This repository is designed to be a lightweight, configurable starting point. You can customize the search, ranking prompt, and tech stack to find repositories that match your own contribution interests.

## What this agent does

- Searches GitHub for repositories whose READMEs include contribution keywords (ideas, gsoc, contribution, student) and match configured languages and freshness constraints.
- Calls a Groq LLM to rank repositories in batches, producing a numeric score (0–100), predicted focus area (Backend/Frontend/AI/etc.), key techs, and a short note for maintainers.
- Upserts (add-only) high-scoring candidates into a Notion database so you can review and triage them later.
- Optionally sends an email alert listing newly inserted projects.

Use cases

- Discover GSOC-friendly projects tailored to particular skill sets.
- Build a curated pipeline of open-source tasks for students or new contributors.
- Automate scouting and triage of potential contribution targets for a community program.

## Repository structure

- `src/`
  - `index.ts` — orchestration: search → rank → upsert → email.
  - `tools/githubSearch.ts` — GitHub discovery logic.
  - `tools/rankProjects.ts` — calls Groq LLM and parses responses.
  - `tools/notionUpsert.ts` — upserts results into Notion.
  - `tools/emailer.ts` — optional email notification via Gmail/Nodemailer.
  - `config.ts` — thresholds, batching and logging options.
  - `types.ts` — TypeScript data shapes.
- `package.json`, `tsconfig.json` — project metadata and TypeScript config.

_NOTE:_ This repo uses ESM + `ts-node/esm` for development convenience.

## Prerequisites

- Node.js 18+ (recommended) or compatible modern Node.
- A Notion integration with a database (Notion internal integration token and database id).
- A Groq API key (or swap for another LLM provider in `rankProjects.ts`).
- A GitHub token (classic PAT) with public_repo read access.
- Optional: Gmail credentials if you want email alerts (or modify `emailer.ts` to another delivery method).

## Setup

1. Clone the repo:

```powershell
cd %USERPROFILE%\Desktop\thinkr
git clone <repo-url> project4
cd project4
```

2. Install dependencies:

```powershell
npm install
```

3. Create a `.env` file with these variables (example values shown in `.env`):

- `OPENAI_API_KEY` / `GROQ_API_KEY` — your Groq/OpenAI key used by the Groq SDK.
- `GITHUB_TOKEN` — GitHub personal access token.
- `NOTION_API_KEY` — Notion integration token.
- `NOTION_DATABASE_ID` — Notion database id where pages will be created.
- `GMAIL_USER`, `GMAIL_PASS`, `ALERT_EMAIL` — (optional) to send email alerts.
- `NODE_TLS_REJECT_UNAUTHORIZED=0` — ONLY if you intentionally want to skip TLS verification (not recommended).

Make sure `NOTION_DATABASE_ID` contains only the database id (no trailing comments or spaces).

4. Run in development mode:

```powershell
npm run dev
```

This will run `src/index.ts` (via `ts-node/esm`). The script prints progress and a final summary.

## How to customize search and ranking

- Change which languages to search in `src/config.ts` (`DEFAULT_LANGUAGES`). Add or remove languages to broaden/narrow discovery.
- Change time and star thresholds in `src/config.ts` (`UPDATED_SINCE`, `MIN_STARS`).
- Adjust batching (`BATCH`) or maximum results (`MAX_RESULTS`).

To change the AI prompt used for ranking, open `src/tools/rankProjects.ts` and edit the `sys` string. The code crafts a system prompt and asks the LLM to return a JSON array with a specific shape. If you change the expected JSON schema, make sure `rankProjects` maps/validates the response accordingly.

Examples of prompt edits:
- Increase temperature for more diverse scoring.
- Ask the model to prefer certain frameworks or community-friendly labels.

## Changing the tech-stack or model

- This repo uses `groq-sdk`. Replace `src/tools/rankProjects.ts` with another LLM client if you prefer OpenAI, Anthropic, or a local LLM.
- If you replace the LLM provider, ensure the output format remains predictable (JSON array) or update `rankProjects.ts` to parse the new format.

## Notion schema expectations

The Notion upsert code expects a database with these properties (names are important):
- `Organization Name` — Title
- `Primary Focus Area` — Select
- `Tech Used` — Multi-select
- `Tech Match Score` — Number (0–100)
- `Is Highly Relevant?` — Checkbox
- `GitHub / Project URL` — URL
- `Last Updated` — Date
- `Notes / Strategy` — Rich text

If your database uses different property names, update `src/tools/notionUpsert.ts` to match.

## Troubleshooting

- Error: `db.query is not a function` — Some Notion SDK bundles expose a different surface. The code uses `notion.pages.create(...)` and the SDK's higher-level helpers; if you hit runtime errors, check your `@notionhq/client` version.
- Error: `Invalid request URL` — Ensure `NOTION_DATABASE_ID` in `.env` is a plain id with no inline comment or extra characters.
- If TypeScript or `ts-node` throws about loader deprecation, you can run a compiled build instead:

```powershell
npm run build
node dist/index.js
```

- If email sends fail, verify Gmail credentials and less-secure app access or use an app password.

## Security notes

- Keep your API keys secret. Do not commit `.env` to source control. Add `.env` to `.gitignore`.
- Avoid `NODE_TLS_REJECT_UNAUTHORIZED=0` in production. It's insecure.

## Contributing

Contributions welcome. If you update prompts or the Notion schema mapping, please add notes in the README and keep the default behavior safe (don't delete items from Notion by default).

## License

MIT
