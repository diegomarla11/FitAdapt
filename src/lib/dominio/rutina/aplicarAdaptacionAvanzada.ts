import { aplicarAjustesARutina } from "@/lib/dominio/progresion/aplicarAjustesARutina";
import { obtenerAjustesDesdeMetricas } from "@/lib/dominio/progresion/obtenerAjustesDesdeMetricas";
import { obtenerAjustesGruposMusculares } from "@/lib/dominio/progresion/obtenerAjustesGruposMusculares";
import { resolverCambioVariante } from "@/lib/dominio/rutina/resolverCambioVariante";
import type { Ejercicio } from "@/tipos/ejercicio";
import type { Perfil } from "@/tipos/perfil";

type EjercicioRutina = {
  id: string;
  nombre: string;
  grupo_muscular: string;
  patron_movimiento?: string | null;
  dificultad?: string | null;
  series: number;
  repeticiones: string;
  explicacion_progresion?: {
    accion:
      | "mantener"
      | "subir_series"
      | "bajar_series"
      | "subir_dificultad"
      | "bajar_dificultad"
      | "cambiar_variante";
    estado:
      | "muy_bien"
      | "bien"
      | "neutro"
      | "fatiga"
      | "bajo_rendimiento"
      | "dolor"
      | "sin_datos";
    motivo: string;
    seriesOriginales: number;
    seriesFinales: number;
    nombreOriginal: string;
    nombreFinal: string;
  } | null;
};

function limitarSeries(series: number) {
  if (series < 1) return 1;
  if (series > 6) return 6;
  return series;
}

export async function aplicarAdaptacionAvanzada<T extends EjercicioRutina>(
  ejerciciosDia: T[],
  ejerciciosCatalogo: Ejercicio[],
  perfil: Perfil
): Promise<T[]> {
  const ajustesEjercicios = await obtenerAjustesDesdeMetricas(ejerciciosDia);
  const ajustesGrupos = await obtenerAjustesGruposMusculares();

  const datosOriginales = new Map(
    ejerciciosDia.map((ejercicio) => [
      ejercicio.id,
      {
        nombre: ejercicio.nombre,
        series: ejercicio.series,
      },
    ])
  );

  let resultado = aplicarAjustesARutina(ejerciciosDia, ajustesEjercicios);

  resultado = resultado.map((ejercicio) => {
    const ajusteEjercicio = ajustesEjercicios.get(ejercicio.id);
    const ajusteGrupo = ajustesGrupos.get(ejercicio.grupo_muscular);

    const original = datosOriginales.get(ejercicio.id);

    const nombreOriginal = original?.nombre ?? ejercicio.nombre;
    const seriesOriginales = original?.series ?? ejercicio.series;

    let actual = { ...ejercicio };

    if (ajusteEjercicio?.accion === "cambiar_variante") {
      actual = resolverCambioVariante(
        actual,
        ejerciciosCatalogo,
        perfil,
        ajusteEjercicio.estado === "dolor" ? "dolor" : "mantener"
      ) as T;
    }

    if (ajusteEjercicio?.accion === "bajar_dificultad") {
      actual = resolverCambioVariante(
        actual,
        ejerciciosCatalogo,
        perfil,
        ajusteEjercicio.estado === "fatiga" ? "fatiga" : "bajar_dificultad"
      ) as T;
    }

    if (ajusteEjercicio?.accion === "subir_dificultad") {
      actual = resolverCambioVariante(
        actual,
        ejerciciosCatalogo,
        perfil,
        "subir_dificultad"
      ) as T;
    }

    if (ajusteGrupo?.accion === "reducir_volumen") {
      const esAccesorio = actual.patron_movimiento === "aislamiento";

      if (esAccesorio) {
        actual.series = limitarSeries(actual.series - 1);
      }
    }

    if (ajusteGrupo?.accion === "aumentar_volumen") {
      const esAccesorio = actual.patron_movimiento === "aislamiento";

      if (esAccesorio) {
        actual.series = limitarSeries(actual.series + 1);
      }
    }

    if (ajusteEjercicio) {
      actual.explicacion_progresion = {
        accion: ajusteEjercicio.accion,
        estado: ajusteEjercicio.estado,
        motivo: ajusteEjercicio.motivo,
        seriesOriginales,
        seriesFinales: actual.series,
        nombreOriginal,
        nombreFinal: actual.nombre,
      };
    }

    return actual;
  });

  return resultado;
}