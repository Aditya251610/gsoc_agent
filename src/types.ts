export type ProjectItem = {
  org: string;
  project: string;
  repo: string;
  homepage?: string | null;
  description?: string | null;
  lang?: string | null;
  topics?: string[] | null;
};

export type RankedItem = ProjectItem & {
  score: number; // 0–100
  focus: "Backend" | "Frontend" | "Infra" | "AI" | "DevRel" | "Tooling" | "Docs";
  tech: string[];
  note?: string;
  isRelevant: boolean;
};
