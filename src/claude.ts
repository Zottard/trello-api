export type CardInput = {
  name: string;
  desc: string;
  labels: string[];
  board: "vietur" | "tex";
  list: string;
  repo: { name: string; path: string };
};

const PROJECT_CONTEXT: Record<CardInput["board"], string> = {
  tex: "Tour Experto — plataforma de venta de tours y viajes. Backend Node.js/AWS Lambda.",
  vietur: "Vietur — agencia de turismo.",
};

export function generatePrompt(card: CardInput): string {
  const ctx = PROJECT_CONTEXT[card.board];
  const labels = card.labels.join(", ") || "sin labels";
  const desc = card.desc.trim()
    ? `\n\n${card.desc.trim()}`
    : "\n\n(Sin descripción — inferir del título)";

  return `Contexto: ${ctx}
Repositorio: ${card.repo.name} | Lista: ${card.list} | Labels: ${labels}

Tarea: ${card.name}${desc}

Explorá el repositorio para entender la estructura antes de implementar. Implementá exactamente lo que se pide, sin agregar features extra.`;
}
