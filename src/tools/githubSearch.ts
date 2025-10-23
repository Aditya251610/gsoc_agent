import axios from "axios";
import type { ProjectItem } from "../types.js";
import { MIN_STARS, UPDATED_SINCE, DEFAULT_LANGUAGES, MAX_RESULTS } from "../config.js";

export async function githubSearch() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error("GITHUB_TOKEN missing in .env");

  // Broad discovery via README keywords + language + freshness + stars
  const langsQuery = DEFAULT_LANGUAGES.map(l => `language:${l}`).join(" ");
  const q = `in:readme (ideas OR gsoc OR contribution OR student) ${langsQuery} stars:>${MIN_STARS} updated:>=${UPDATED_SINCE}`;

  const per_page = 100;
  const pages = Math.ceil(MAX_RESULTS / per_page);
  const headers = {
    Authorization: `Bearer ${token}`,
    "X-GitHub-Api-Version": "2022-11-28",
    Accept: "application/vnd.github+json",
    "User-Agent": "gsoc-agent"
  };

  const results: ProjectItem[] = [];
  for (let page = 1; page <= pages; page++) {
    const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(q)}&sort=updated&order=desc&per_page=${per_page}&page=${page}`;
    const { data } = await axios.get(url, { headers });
    const items = (data?.items ?? []).map((r: any): ProjectItem => ({
      org: r?.owner?.login ?? "",
      project: r?.name ?? "",
      repo: r?.html_url ?? "",
      homepage: r?.homepage ?? null,
      description: r?.description ?? null,
      lang: r?.language ?? null,
      topics: r?.topics ?? []
    }));
    results.push(...items);
    if (!data?.items || data.items.length < per_page) break;
  }

  // dedupe
  const seen = new Set<string>();
  return results.filter(r => {
    const key = (r.repo || "").toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, MAX_RESULTS);
}
