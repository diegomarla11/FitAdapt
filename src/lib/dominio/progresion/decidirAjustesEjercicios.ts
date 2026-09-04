import { evaluarRendimientoEjercicio } from "@/lib/dominio/progresion/evaluarRendimientoEjercicio";
import type {
  AjusteEjercicio,
  MetricasEjercicioReciente,
} from "@/lib/dominio/progresion/tipos";

export function decidirAjusteEjercicio(
  metricas: MetricasEjercicioReciente | null,
  patronMovimiento: string | null
): AjusteEjercicio | null {
  if (!metricas) {
    return null;
  }

  const estado = evaluarRendimientoEjercicio(metricas);
  const esAccesorio = patronMovimiento === "aislamiento";

  if (estado === "dolor") {
    return {
      ejercicioId: metricas.ejercicioId,
      nombreEjercicio: metricas.nombreEjercicio,
      grupoMuscular: metricas.grupoMuscular,
      estado,
      accion: "cambiar_variante",
      deltaSeries: 0,
      motivo:
        "Se ha detectado dolor relevante en registros recientes. Conviene cambiar a una variante más segura o menos conflictiva.",
    };
  }


  if (estado === "muy_bien") {
    return {
      ejercicioId: metricas.ejercicioId,
      nombreEjercicio: metricas.nombreEjercicio,
      grupoMuscular: metricas.grupoMuscular,
      estado,
      accion: esAccesorio ? "subir_series" : "subir_dificultad",
      deltaSeries: esAccesorio ? 1 : 0,
      motivo:
        "Buen cumplimiento reciente, series completas y sensación dominante fácil.",
    };
  }

  if (estado === "bien") {
    return {
      ejercicioId: metricas.ejercicioId,
      nombreEjercicio: metricas.nombreEjercicio,
      grupoMuscular: metricas.grupoMuscular,
      estado,
      accion: "mantener",
      deltaSeries: 0,
      motivo: "Rendimiento estable y sensación adecuada.",
    };
  }

  if (estado === "fatiga") {
    return {
      ejercicioId: metricas.ejercicioId,
      nombreEjercicio: metricas.nombreEjercicio,
      grupoMuscular: metricas.grupoMuscular,
      estado,
      accion: esAccesorio ? "bajar_series" : "bajar_dificultad",
      deltaSeries: esAccesorio ? -1 : 0,
      motivo:
        "Se han detectado señales de fatiga reciente: sensación difícil, descanso real elevado o fatiga percibida alta. Conviene reducir la exigencia antes de progresar.",
    };
  }

  if (estado === "bajo_rendimiento") {
    return {
      ejercicioId: metricas.ejercicioId,
      nombreEjercicio: metricas.nombreEjercicio,
      grupoMuscular: metricas.grupoMuscular,
      estado,
      accion: "cambiar_variante",
      deltaSeries: 0,
      motivo:
        "Cumplimiento bajo o rendimiento insuficiente en varias apariciones recientes.",
    };
  }

  return {
    ejercicioId: metricas.ejercicioId,
    nombreEjercicio: metricas.nombreEjercicio,
    grupoMuscular: metricas.grupoMuscular,
    estado,
    accion: "mantener",
    deltaSeries: 0,
    motivo: "No hay evidencia suficiente para modificar la planificación.",
  };
}