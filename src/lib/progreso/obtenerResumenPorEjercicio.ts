import { obtenerMetricasEjerciciosRecientes } from "@/lib/dominio/progresion/obtenerMetricasEjerciciosRecientes";
import { evaluarRendimientoEjercicio } from "@/lib/dominio/progresion/evaluarRendimientoEjercicio";

export type ResumenEjercicioProgreso = {
  ejercicioId: string;
  nombreEjercicio: string;
  grupoMuscular: string;
  apariciones: number;
  cumplimiento: number;
  ratioSeries: number;
  pesoMedio: number | null;
  sensacionDominante: "facil" | "bien" | "dificil" | null;
  dolorMedio: number | null;
  fatigaMedia: number | null;
  descansoRecomendadoMedio: number | null;
  descansoRealMedio: number | null;
  ratioDescanso: number | null;
  estado:
    | "muy_bien"
    | "bien"
    | "neutro"
    | "fatiga"
    | "bajo_rendimiento"
    | "dolor"
    | "sin_datos";
};

export async function obtenerResumenPorEjercicio(): Promise<
  ResumenEjercicioProgreso[]
> {
  const metricas = await obtenerMetricasEjerciciosRecientes();

  return Array.from(metricas.values())
    .map((metrica) => ({
      ejercicioId: metrica.ejercicioId,
      nombreEjercicio: metrica.nombreEjercicio,
      grupoMuscular: metrica.grupoMuscular,
      apariciones: metrica.apariciones,
      cumplimiento: metrica.cumplimiento,
      ratioSeries: metrica.ratioSeries,
      pesoMedio: metrica.pesoMedio,
      sensacionDominante: metrica.sensacionDominante,
      dolorMedio: metrica.dolorMedio,
      fatigaMedia: metrica.fatigaMedia,
      descansoRecomendadoMedio: metrica.descansoRecomendadoMedio,
      descansoRealMedio: metrica.descansoRealMedio,
      ratioDescanso: metrica.ratioDescanso,
      estado: evaluarRendimientoEjercicio(metrica),
    }))
    .sort((a, b) => b.apariciones - a.apariciones);
}