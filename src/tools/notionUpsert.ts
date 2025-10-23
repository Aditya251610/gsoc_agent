// src/tools/notionUpsert.ts

import { Client } from "@notionhq/client";
import type { RankedItem } from "../types.js";

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const DB_ID = process.env.NOTION_DATABASE_ID!;

export async function notionUpsert(items: RankedItem[]) {
  const created: string[] = [];
  let skippedExists = 0;

  for (const item of items) {
    if (!item.repo) continue;

    // ✅ Modern Notion API matching — search pages inside this DB
    const search = await notion.search({
      filter: { property: "object", value: "page" },
      query: item.repo
    });

    const alreadyExists = search.results.some((page: any) =>
      page?.properties?.["GitHub / Project URL"]?.url === item.repo
    );

    if (alreadyExists) {
      skippedExists++;
      continue;
    }

    await notion.pages.create({
      parent: { database_id: DB_ID },
      properties: {
        "Organization Name": {
          title: [{ type: "text", text: { content: item.org || "(Unknown Org)" } }]
        },
        "Primary Focus Area": item.focus
          ? { select: { name: item.focus } }
          : { select: null },

        "Tech Used": {
          multi_select: (item.tech || []).map((t: string) => ({ name: t }))
        },

        "Tech Match Score": {
          number: (item.score ?? 0) / 100
        },

        "Is Highly Relevant?": {
          checkbox: !!item.isRelevant
        },

        "GitHub / Project URL": {
          url: item.repo
        },

        "Last Updated": {
          date: { start: new Date().toISOString() }
        },

        "Notes / Strategy": {
          rich_text: item.note
            ? [{ type: "text", text: { content: item.note } }]
            : []
        }
      }
    });

    created.push(item.repo);
  }

  return { inserted: created.length, urls: created, skippedExists };
}
