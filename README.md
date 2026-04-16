# trello-api

Servidor de automatización que conecta Trello con el desarrollo asistido por IA. Toma las cards activas del sprint, las procesa y genera prompts listos para usar en [Claude Code](https://claude.ai/code) — con contexto del proyecto, ruta del repositorio, labels y descripción de la tarea incluidos.

## Cómo funciona

```
Boards de Trello → Cards del sprint activo → Prompts estructurados → /prompts/{fecha}/*.md
```

1. Se obtienen las cards de las listas configuradas (`sprint actual`, `en progreso`, `sprint-{n}`)
2. Cada card se enriquece con contexto del proyecto, ruta del repo y labels
3. Se generan archivos markdown organizados por fecha
4. Un scheduler corre la generación automáticamente todos los días a las 9am

## Stack

| Capa | Tecnología | Por qué |
|---|---|---|
| Runtime | [Bun](https://bun.sh) | 4× más rápido que Node, TypeScript nativo, sin config |
| Framework | [Hono](https://hono.dev) | Mínimo overhead, TypeScript-first, compatible con edge |
| Validación | [Zod](https://zod.dev) | Seguridad en runtime para env vars y límites del sistema |
| Lenguaje | TypeScript (strict) | Type safety de punta a punta |

Sin ORM ni base de datos — los prompts son archivos markdown planos, los boards se configuran en código.

## API

```
GET  /health              → { ok: true }
GET  /cards               → todos los boards, filtrado por listas del sprint activo
GET  /cards/:board        → board específico (vietur | tex)
POST /prompts/generate    → dispara la generación de prompts on demand
GET  /prompts             → índice de todos los archivos generados por fecha
```

## Estructura

```
src/
├── index.ts        # Bootstrap del servidor + validación de env
├── config.ts       # Definición de boards, repos y templates de prompts
├── trello.ts       # Cliente de la API de Trello (fetch nativo, tipado)
├── claude.ts       # Lógica de generación de prompts
├── prompts.ts      # Orquestación de la generación diaria
├── scheduler.ts    # Scheduler diario con setTimeout (9am)
└── routes/
    ├── cards.ts    # Endpoints de cards
    └── prompts.ts  # Endpoints de prompts

prompts/
└── YYYY-MM-DD/     # Archivos markdown generados, uno por card
```

## Configuración

**Requisitos:** [Bun](https://bun.sh) ≥ 1.0

```bash
bun install
```

Crear un archivo `.env`:

```env
TRELLO_API_KEY=tu_api_key
TRELLO_TOKEN=tu_token
PORT=4000
```

Las credenciales se obtienen en [trello.com/app-key](https://trello.com/app-key).

## Uso

```bash
# Desarrollo (hot reload)
bun dev

# Producción
bun start
```

## Generación de prompts

Se genera automáticamente a las 9am todos los días. Para disparar manualmente:

```bash
curl -X POST http://localhost:4000/prompts/generate
```

Cada prompt incluye contexto del proyecto, nombre y ruta del repositorio, lista y labels de la card, y las instrucciones para implementar exactamente lo que se pide.

### Resolución de repos por label (board Vietur)

Cards con label `front` → repo CMS. Cards con label `back` → repo backend. Ambas labels → un prompt por repo. Esto permite que una sola card genere prompts para tareas full-stack.

## Decisiones de diseño

- **Archivos planos sobre base de datos** — los prompts son descartables, legibles por humanos y no requieren infraestructura.
- **setTimeout sobre cron** — evita la dependencia `node-cron` para un único job diario.
- **Fetching en paralelo** — `Promise.all` por board y lista; 3 boards × 2 listas = 6 requests concurrentes.
- **Config-driven** — boards, listas y repos viven en un solo archivo. Agregar un proyecto nuevo son ~5 líneas.

## Licencia

MIT
