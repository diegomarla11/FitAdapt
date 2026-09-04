export function validarRepeticionesReales(
  seriesReales: number | null,
  repeticionesReales: string | null
) {
  if (!repeticionesReales || !repeticionesReales.trim()) {
    return true;
  }

  if (!seriesReales || seriesReales <= 0) {
    return false;
  }

  const texto = repeticionesReales.trim();

  const esNumeroUnico = /^\d+$/.test(texto);

  if (esNumeroUnico) {
    return true;
  }

  const bloques = texto
    .split("-")
    .map((valor) => valor.trim())
    .filter(Boolean);

  if (bloques.length !== seriesReales) {
    return false;
  }

  return bloques.every((bloque) => /^\d+$/.test(bloque));
}