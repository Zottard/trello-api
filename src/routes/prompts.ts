import { Hono } from "hono";
import { readdir } from "fs/promises";
import path from "path";
import { generateDailyPrompts } from "../prompts";

const prompts = new Hono();

const PROMPTS_DIR = path.join(import.meta.dir, "..", "..", "prompts");

prompts.post("/generate", async (c) => {
  const result = await generateDailyPrompts();
  return c.json(result);
});

prompts.get("/", async (c) => {
  try {
    const days = await readdir(PROMPTS_DIR);
    const index: Record<string, string[]> = {};

    for (const day of days.sort().reverse()) {
      try {
        const files = await readdir(path.join(PROMPTS_DIR, day));
        index[day] = files.filter((f) => f.endsWith(".md"));
      } catch {
        // skip
      }
    }

    return c.json(index);
  } catch {
    return c.json({});
  }
});

export default prompts;
