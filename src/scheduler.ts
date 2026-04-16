import { generateDailyPrompts } from "./prompts";

function msUntilHour(hour: number): number {
  const now = new Date();
  const next = new Date(now);
  next.setHours(hour, 0, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  return next.getTime() - now.getTime();
}

export function startScheduler() {
  const run = async () => {
    console.log("[cron] Generando prompts diarios...");
    const result = await generateDailyPrompts().catch((e) => {
      console.error("[cron] Error:", e);
      return null;
    });
    if (result) {
      console.log(`[cron] ${result.generated} prompts generados en prompts/${new Date().toISOString().slice(0, 10)}/`);
      if (result.errors.length) console.warn("[cron] Errores:", result.errors);
    }
    setTimeout(run, 24 * 60 * 60 * 1000);
  };

  const delay = msUntilHour(9);
  const mins = Math.round(delay / 60000);
  console.log(`[scheduler] Próxima generación en ${mins} minutos (9am)`);
  setTimeout(run, delay);
}
