import { Hono } from "hono";
import { getBoards, getLists, getCards } from "../trello";
import { BOARDS_CONFIG, type BoardKey } from "../config";

const cards = new Hono();

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

async function fetchCardsForBoard(boardKey: BoardKey) {
  const config = BOARDS_CONFIG[boardKey];
  const allBoards = await getBoards();
  const board = allBoards.find(
    (b) => b.name.toLowerCase() === config.boardName.toLowerCase()
  );
  if (!board) throw new Error(`Board "${config.boardName}" not found`);

  const lists = await getLists(board.id);
  const targetedLists = lists.filter((l) =>
    matchesList(l.name, config.targetLists as string[] | "sprint-pattern")
  );

  const results = await Promise.all(
    targetedLists.map(async (list) => ({
      list: list.name,
      cards: await getCards(list.id),
    }))
  );

  return { board: board.name, lists: results };
}

cards.get("/", async (c) => {
  const [vietur, tex] = await Promise.all([
    fetchCardsForBoard("vietur"),
    fetchCardsForBoard("tex"),
  ]);
  return c.json({ vietur, tex });
});

cards.get("/:board", async (c) => {
  const board = c.req.param("board") as BoardKey;
  if (!BOARDS_CONFIG[board]) {
    return c.json({ error: `Board "${board}" not valid. Use: vietur, tex` }, 404);
  }
  const data = await fetchCardsForBoard(board);
  return c.json(data);
});

export default cards;
