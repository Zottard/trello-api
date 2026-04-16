import { Hono } from "hono";
import { z } from "zod";
import cards from "./routes/cards";
import prompts from "./routes/prompts";
import { startScheduler } from "./scheduler";

const envSchema = z.object({
  TRELLO_API_KEY: z.string().min(1),
  TRELLO_TOKEN: z.string().min(1),
  PORT: z.coerce.number().default(4000),
});

const env = envSchema.parse(process.env);

const app = new Hono();

app.route("/cards", cards);
app.route("/prompts", prompts);
app.get("/health", (c) => c.json({ ok: true }));

startScheduler();

console.log(`Server running on http://localhost:${env.PORT}`);

export default {
  port: env.PORT,
  fetch: app.fetch,
};
