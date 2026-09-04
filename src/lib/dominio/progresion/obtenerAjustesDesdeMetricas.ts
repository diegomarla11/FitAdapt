import { decidirAjusteEjercicio } from "@/lib/dominio/progresion/decidirAjustesEjercicios";
import { obtenerMetricasEjerciciosRecientes } from "@/lib/dominio/progresion/obtenerMetricasEjerciciosRecientes";
import type {
  AjusteEjercicio,
  MetricasEjercicioReciente,
} from "@/lib/dominio/progresion/tipos";

type EjercicioPlantilla = {
  id: string;
  nombre: string;
  grupo_muscular: string;
  patron_movimiento?: string | null;
};

function normalizarTexto(valor: string) {
  return valor.trim().toLowerCase();
}

function buscarMetricaPorNombre(
  metricas: Map<string, MetricasEjercicioReciente>,
  ejercicio: EjercicioPlantilla
) {
  const nombreEjercicio = normalizarTexto(ejercicio.nombre);

  return (
    Array.from(metricas.values()).find(
      (metrica) =>
        normalizarTexto(metrica.nombreEjercicio) === nombreEjercicio
    ) ?? null
  );
}

export async function obtenerAjustesDesdeMetricas(
  ejercicios: EjercicioPlantilla[]
): Promise<Map<string, AjusteEjercicio>> {
  const metricas = await obtenerMetricasEjerciciosRecientes();
  const ajustes = new Map<string, AjusteEjercicio>();

  for (const ejercicio of ejercicios) {
    const metrica =
      metricas.get(ejercicio.id) ?? buscarMetricaPorNombre(metricas, ejercicio);

    const ajuste = decidirAjusteEjercicio(
      metrica,
      ejercicio.patron_movimiento ?? null
    );

    if (ajuste) {
      ajustes.set(ejercicio.id, ajuste);
    }
  }

  return ajustes;
}