export const BOARDS_CONFIG = {
  vietur: {
    boardName: "web vietur",
    targetLists: ["sprint actual", "en progreso"] as string[],
  },
  tex: {
    boardName: "desarrollo web tex",
    targetLists: "sprint-pattern" as const,
  },
} as const;

export const REPOS = {
  tex: {
    name: "tourExperto-backend",
    path: "C:\\Users\\silvy\\Documents\\GitHub\\tourExperto-backend",
  },
  vietur: {
    front: {
      name: "CMS-Vietur",
      path: "C:\\Users\\silvy\\Documents\\GitHub\\CMS-Vietur",
    },
    back: {
      name: "vietur-backend",
      path: "C:\\Users\\silvy\\OneDrive\\Documentos\\gastos-app\\vietur-backend",
    },
  },
} as const;

export type BoardKey = keyof typeof BOARDS_CONFIG;
