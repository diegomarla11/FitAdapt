import type {
  EstadoRendimientoEjercicio,
  MetricasEjercicioReciente,
} from "@/lib/dominio/progresion/tipos";

export function evaluarRendimientoEjercicio(
  metricas: MetricasEjercicioReciente | null
): EstadoRendimientoEjercicio {
  if (!metricas || metricas.apariciones === 0) {
    return "sin_datos";
  }

  const dolorMedio = metricas.dolorMedio ?? 0;
  const dolorMaximo = metricas.dolorMaximo ?? 0;
  const fatigaMedia = metricas.fatigaMedia ?? 5;
  const ratioDescanso = metricas.ratioDescanso ?? 1;

  if (dolorMaximo >= 4 || dolorMedio >= 4) {
    return "dolor";
  }

  if (
    fatigaMedia >= 8 ||
    ratioDescanso >= 1.5 ||
    (metricas.sensacionDominante === "dificil" && metricas.ratioSeries < 0.95)
  ) {
    return "fatiga";
  }

  if (metricas.cumplimiento < 0.6 || metricas.ratioSeries < 0.75) {
    return "bajo_rendimiento";
  }

  if (
    metricas.cumplimiento >= 0.9 &&
    metricas.ratioSeries >= 0.95 &&
    metricas.sensacionDominante === "facil" &&
    dolorMedio <= 2 &&
    fatigaMedia <= 6 &&
    ratioDescanso <= 1.2
  ) {
    return "muy_bien";
  }

  if (
    metricas.cumplimiento >= 0.8 &&
    metricas.ratioSeries >= 0.9 &&
    (metricas.sensacionDominante === "bien" ||
      metricas.sensacionDominante === "facil") &&
    dolorMedio <= 3 &&
    fatigaMedia <= 7
  ) {
    return "bien";
  }

  return "neutro";
}