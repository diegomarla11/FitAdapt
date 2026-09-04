export function parsearTextoLista(texto: string | null | undefined): string[] {
  if (!texto) {
    return [];
  }

  return texto
    .split("\n")
    .map((linea) => linea.trim())
    .filter(Boolean)
    .map((linea) => linea.replace(/^[-•\d.]+\s*/, "").trim())
    .filter(Boolean);
}