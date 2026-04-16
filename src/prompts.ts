import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { getBoards, getLists, getCards, type Card } from "./trello";
import { BOARDS_CONFIG, REPOS, type BoardKey } from "./config";
import { generatePrompt, type CardInput } from "./claude";

const PROMPTS_DIR = path.join(import.meta.dir, "..", "prompts");

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

function todayFolder(): string {
  return new Date().toISOString().slice(0, 10);
}

function matchesList(
  listName: string,
  targetLists: string[] | "sprint-pattern"
): boolean {
  const lower = listName.toLowerCase();
  if (targetLists === "sprint-pattern") {
    return /^sprint\s+\d+$/i.test(lower) || lower === "en progreso";
  }
  return targetLists.some((t) => lower === t.toLowerCase());
}

function getReposForCard(
  boardKey: BoardKey,
  labels: string[]
): { name: string; path: string; labelHint?: string }[] {
  const labelNames = labels.map((l) => l.toLowerCase());

  if (boardKey === "tex") {
    return [REPOS.tex];
  }

  const hasFront = labelNames.includes("front");
  const hasBack = labelNames.includes("back");

  if (hasFront && hasBack) {
    return [
      { ...REPOS.vietur.front, labelHint: "front" },
      { ...REPOS.vietur.back, labelHint: "back" },
    ];
  }
  if (hasBack) return [{ ...REPOS.vietur.back, labelHint: "back" }];
  return [{ ...REPOS.vietur.front, labelHint: "front" }];
}

function buildMarkdown(params: {
  card: Card;
  boardKey: BoardKey;
  listName: string;
  repo: { name: string; path: string };
  prompt: string;
  generatedAt: string;
}): string {
  const { card, boardKey, listName, repo, prompt, generatedAt } = params;
  const boardLabel = boardKey === "tex" ? "DESARROLLO WEB TEX" : "WEB VIETUR";
  const labelNames = card.labels.map((l) => l.name).join(", ") || "—";

  return `# ${card.name}

**Board:** ${boardLabel}
**Lista:** ${listName}
**Labels:** ${labelNames}
**URL:** ${card.shortUrl}
**Repo:** ${repo.name}
**Generado:** ${generatedAt}

---

## Descripción

${card.desc.trim() || "_(sin descripción)_"}

---

## Prompt para Claude Code

${prompt}

---

## Cómo usar

\`\`\`bash
cd "${repo.path}"
\`\`\`

Abrí Claude Code en ese directorio y pegá el prompt de arriba.
`;
}

export async function generateDailyPrompts(): Promise<{
  generated: number;
  files: string[];
  errors: { card: string; error: string }[];
}> {
  const folder = todayFolder();
  const outputDir = path.join(PROMPTS_DIR, folder);
  await mkdir(outputDir, { recursive: true });

  const allBoards = await getBoards();
  const files: string[] = [];
  const errors: { card: string; error: string }[] = [];
  const generatedAt = new Date().toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" });

  for (const [boardKey, config] of Object.entries(BOARDS_CONFIG) as [BoardKey, typeof BOARDS_CONFIG[BoardKey]][]) {
    const board = allBoards.find(
      (b) => b.name.toLowerCase() === config.boardName.toLowerCase()
    );
    if (!board) continue;

    const lists = await getLists(board.id);
    const targetedLists = lists.filter((l) =>
      matchesList(l.name, config.targetLists as string[] | "sprint-pattern")
    );

    for (const list of targetedLists) {
      const cards = await getCards(list.id);

      for (const card of cards) {
        const labelNames = card.labels.map((l) => l.name);
        const repos = getReposForCard(boardKey, labelNames);

        for (const repo of repos) {
          try {
            const cardInput: CardInput = {
              name: card.name,
              desc: card.desc,
              labels: labelNames,
              board: boardKey,
              list: list.name,
              repo,
            };

            const prompt = generatePrompt(cardInput);
            const suffix = repo.labelHint ? `-${repo.labelHint}` : "";
            const filename = `${boardKey}-${toSlug(card.name)}${suffix}.md`;
            const filepath = path.join(outputDir, filename);

            await writeFile(
              filepath,
              buildMarkdown({ card, boardKey, listName: list.name, repo, prompt, generatedAt })
            );

            files.push(`prompts/${folder}/${filename}`);
          } catch (err) {
            errors.push({
              card: card.name,
              error: err instanceof Error ? err.message : String(err),
            });
          }
        }
      }
    }
  }

  return { generated: files.length, files, errors };
}
