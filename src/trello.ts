const BASE_URL = "https://api.trello.com/1";

const auth = () =>
  `key=${process.env.TRELLO_API_KEY}&token=${process.env.TRELLO_TOKEN}`;

async function get<T>(path: string): Promise<T> {
  const sep = path.includes("?") ? "&" : "?";
  const res = await fetch(`${BASE_URL}${path}${sep}${auth()}`);
  if (!res.ok) throw new Error(`Trello API error ${res.status}: ${path}`);
  return res.json() as Promise<T>;
}

type Board = { id: string; name: string };
type List = { id: string; name: string; idBoard: string };
type Card = {
  id: string;
  name: string;
  desc: string;
  url: string;
  idList: string;
  idBoard: string;
  labels: { name: string; color: string }[];
  due: string | null;
  shortUrl: string;
};

export async function getBoards(): Promise<Board[]> {
  return get<Board[]>("/members/me/boards?fields=id,name");
}

export async function getLists(boardId: string): Promise<List[]> {
  return get<List[]>(`/boards/${boardId}/lists?fields=id,name,idBoard`);
}

export async function getCards(listId: string): Promise<Card[]> {
  return get<Card[]>(
    `/lists/${listId}/cards?fields=id,name,desc,url,idList,idBoard,labels,due,shortUrl`
  );
}

export type { Board, List, Card };
