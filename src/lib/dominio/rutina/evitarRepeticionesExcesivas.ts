import { seleccionarEjerciciosFiltrados } from "@/lib/rutina/seleccionEjercicios";
import type { Ejercicio } from "@/tipos/ejercicio";
import type { Perfil } from "@/tipos/perfil";
import type {
  DiaRutinaSemanal,
  EjercicioRutinaSemanal,
} from "@/lib/dominio/rutina/tipos";

function convertirAEjercicioRutina<T extends EjercicioRutinaSemanal>(
  original: T,
  reemplazo: Ejercicio
): T {
  return {
    ...original,
    id: reemplazo.id,
    nombre: reemplazo.nombre,
    grupo_muscular: reemplazo.grupo_muscular,
    patron_movimiento: reemplazo.patron_movimiento,
    dificultad: reemplazo.dificultad,
  };
}

export function evitarRepeticionesExcesivas<T extends EjercicioRutinaSemanal>(
  dias: DiaRutinaSemanal<T>[],
  ejerciciosCatalogo: Ejercicio[],
  perfil: Perfil,
  maxRepeticionesPorEjercicio = 2
): DiaRutinaSemanal<T>[] {
  const resultado = dias.map((dia) => ({
    ...dia,
    ejercicios: [...dia.ejercicios],
  }));

  const conteoPorEjercicio = new Map<string, number>();

  for (const dia of resultado) {
    dia.ejercicios = dia.ejercicios.map((ejercicio) => {
      const repeticionesActuales = conteoPorEjercicio.get(ejercicio.id) ?? 0;

      if (repeticionesActuales <= maxRepeticionesPorEjercicio) {
        return ejercicio;
      }

      const alternativas = seleccionarEjerciciosFiltrados(ejerciciosCatalogo, {
        grupoMuscular: ejercicio.grupo_muscular,
        patronMovimiento: ejercicio.patron_movimiento ?? undefined,
        equipoDisponiblePerfil: perfil.equipo_disponible,
        molestiasPerfil: perfil.molestias,
      }).filter((candidato) => {
        if (candidato.id === ejercicio.id) {
          return false;
        }

        const usosAlternativa = conteoPorEjercicio.get(candidato.id) ?? 0;
        return usosAlternativa < maxRepeticionesPorEjercicio;
      });

      const reemplazo = alternativas[0];

      if (!reemplazo) {
        return ejercicio;
      }

      conteoPorEjercicio.set(ejercicio.id, repeticionesActuales - 1);
      conteoPorEjercicio.set(
        reemplazo.id,
        (conteoPorEjercicio.get(reemplazo.id) ?? 0) + 1
      );

      return convertirAEjercicioRutina(ejercicio, reemplazo);
    });
  }

  return resultado;
}