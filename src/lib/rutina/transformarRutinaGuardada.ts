import type {
  RutinaGenerada,
  DiaRutina,
  EjercicioRutina,
} from "@/tipos/rutina";
import type {
  RutinaGuardada,
  RutinaEjercicioGuardado,
} from "@/tipos/rutinaGuardada";

export function transformarRutinaGuardada(
  rutina: RutinaGuardada,
  ejercicios: RutinaEjercicioGuardado[]
): RutinaGenerada {
  const mapaDias = new Map<number, DiaRutina>();

  for (const ejercicio of ejercicios) {
    if (!mapaDias.has(ejercicio.dia)) {
      mapaDias.set(ejercicio.dia, {
        dia: ejercicio.dia,
        titulo: ejercicio.titulo_dia,
        ejercicios: [],
      });
    }

    function obtenerEjercicioRelacionado(
      ejercicio:
        | {
          patron_movimiento: string | null;
          dificultad: string | null;
          equipamiento: string | null;
        }
        | {
          patron_movimiento: string | null;
          dificultad: string | null;
          equipamiento: string | null;
        }[]
        | null
        | undefined
    ) {
      if (!ejercicio) {
        return null;
      }

      if (Array.isArray(ejercicio)) {
        return ejercicio[0] ?? null;
      }

      return ejercicio;
    }

    const diaActual = mapaDias.get(ejercicio.dia);

    if (diaActual) {
      const ejercicioRelacionado = obtenerEjercicioRelacionado(ejercicio.ejercicios);

      const ejercicioTransformado: EjercicioRutina = {
        id: ejercicio.ejercicio_id || "",
        nombre: ejercicio.nombre_ejercicio,
        grupo_muscular: ejercicio.grupo_muscular,
        patron_movimiento: ejercicioRelacionado?.patron_movimiento ?? null,
        dificultad: ejercicioRelacionado?.dificultad ?? null,
        series: ejercicio.series,
        repeticiones: ejercicio.repeticiones,
      };

      diaActual.ejercicios.push(ejercicioTransformado);
    }
  }

  const dias = Array.from(mapaDias.values()).sort((a, b) => a.dia - b.dia);

  return {
    objetivo: rutina.objetivo,
    nivel: rutina.nivel,
    dias_por_semana: rutina.dias_por_semana,
    indice_rotacion: rutina.indice_rotacion ?? 0,
    dias,
  };
}