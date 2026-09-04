import type { AjusteEjercicio } from "@/lib/dominio/progresion/tipos";

type EjercicioRutina = {
  id: string;
  nombre: string;
  grupo_muscular: string;
  patron_movimiento?: string | null;
  series: number;
  repeticiones: string;
};

function limitarSeries(series: number) {
  if (series < 1) return 1;
  if (series > 6) return 6;
  return series;
}

export function aplicarAjustesARutina<T extends EjercicioRutina>(
  ejercicios: T[],
  ajustes: Map<string, AjusteEjercicio>
): T[] {
  return ejercicios.map((ejercicio) => {
    const ajuste = ajustes.get(ejercicio.id);

    if (!ajuste) {
      return ejercicio;
    }

    if (ajuste.accion === "subir_series") {
      return {
        ...ejercicio,
        series: limitarSeries(ejercicio.series + Math.max(1, ajuste.deltaSeries)),
      };
    }

    if (ajuste.accion === "bajar_series") {
      return {
        ...ejercicio,
        series: limitarSeries(ejercicio.series + Math.min(-1, ajuste.deltaSeries)),
      };
    }

    return ejercicio;
  });
}