export type ResumenSesion = {
  ejerciciosCompletados: number;
  totalSeriesReales: number;
  totalPesoRegistrado: number;
  faciles: number;
  bien: number;
  dificiles: number;
};

export function calcularResumenSesion(
  ejercicios: {
    pesoUsado: number | null;
    seriesReales: number | null;
    sensacion: "facil" | "bien" | "dificil" | null;
  }[]
): ResumenSesion {
  let totalSeriesReales = 0;
  let totalPesoRegistrado = 0;
  let faciles = 0;
  let bien = 0;
  let dificiles = 0;

  for (const ejercicio of ejercicios) {
    totalSeriesReales += ejercicio.seriesReales ?? 0;
    totalPesoRegistrado += ejercicio.pesoUsado ?? 0;

    if (ejercicio.sensacion === "facil") faciles++;
    if (ejercicio.sensacion === "bien") bien++;
    if (ejercicio.sensacion === "dificil") dificiles++;
  }

  return {
    ejerciciosCompletados: ejercicios.length,
    totalSeriesReales,
    totalPesoRegistrado,
    faciles,
    bien,
    dificiles,
  };
}