# trello-api

A lightweight automation server that bridges Trello project management with AI-assisted development. It fetches active sprint cards from configured Trello boards and auto-generates ready-to-use [Claude Code](https://claude.ai/code) prompts — complete with project context, repo paths, labels, and task descriptions — eliminating manual context gathering before implementing a feature.

## How it works

```
Trello Boards → Active Sprint Cards → Structured Prompts → /prompts/{date}/*.md
```

1. Cards are pulled from configured lists (`sprint actual`, `en progreso`, `sprint-{n}`)
2. Each card is enriched with board context, repository path, and labels
3. Prompts are generated as markdown files, organized by date
4. A scheduler runs the generation automatically every day at 9am

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Runtime | [Bun](https://bun.sh) | 4× faster startup, built-in TypeScript, no config |
| Framework | [Hono](https://hono.dev) | Minimal overhead, native TypeScript, edge-compatible |
| Validation | [Zod](https://zod.dev) | Runtime safety for env vars and API boundaries |
| Language | TypeScript (strict) | End-to-end type safety across the full pipeline |

Zero ORM, zero database — prompts are flat markdown files, boards are config-driven.

## API

```
GET  /health              → { ok: true }
GET  /cards               → all boards, filtered by active sprint lists
GET  /cards/:board        → single board (vietur | tex)
POST /prompts/generate    → trigger prompt generation on demand
GET  /prompts             → index of all generated prompt files by date
```

## Project structure

```
src/
├── index.ts        # Server bootstrap + env validation
├── config.ts       # Board definitions, repo paths, prompt templates
├── trello.ts       # Trello API client (native fetch, fully typed)
├── claude.ts       # Prompt generation logic
├── prompts.ts      # Daily generation orchestration
├── scheduler.ts    # setTimeout-based daily scheduler (9am)
└── routes/
    ├── cards.ts    # Card fetching endpoints
    └── prompts.ts  # Prompt listing + generation endpoints

prompts/
└── YYYY-MM-DD/     # Generated markdown files, one per card
```

## Setup

**Requirements:** [Bun](https://bun.sh) ≥ 1.0

```bash
bun install
```

Create a `.env` file:

```env
TRELLO_API_KEY=your_api_key
TRELLO_TOKEN=your_token
PORT=4000
```

Get your credentials at [trello.com/app-key](https://trello.com/app-key).

## Running

```bash
# Development (hot reload)
bun dev

# Production
bun start
```

## Prompt generation

Prompts are generated automatically at 9am daily. To trigger on demand:

```bash
curl -X POST http://localhost:4000/prompts/generate
```

Each prompt file includes:
- Card title and description
- Project context (which product, which stack)
- Target repository name and absolute path
- Sprint list and labels
- Instructions for scoped, focused implementation

### Smart repo resolution (Vietur board)

Cards labeled `front` → CMS repo. Cards labeled `back` → backend repo. Both labels → prompts for both repos. This lets one card spawn multiple targeted prompts for full-stack tasks.

## Configuration

Boards and repos are defined in [`src/config.ts`](src/config.ts). Adding a new board:

```ts
export const BOARDS_CONFIG = {
  myboard: {
    boardName: "My Trello Board",
    targetLists: ["sprint actual", "en progreso"],
  },
  // ...
};
```

## Design decisions

- **Flat files over a database** — prompts are disposable, date-organized, and human-readable. No infra needed.
- **setTimeout over cron** — avoids the `node-cron` dependency for a single daily job. Recalculates at midnight-crossing correctly.
- **Parallel board fetching** — `Promise.all` across boards and lists; fetching 3 boards × 2 lists = 6 concurrent requests.
- **Config-driven, not hardcoded** — boards, lists, and repos live in one file. New projects take ~5 lines.

## License

MIT
