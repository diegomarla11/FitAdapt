import { evitarRepeticionesExcesivas } from "@/lib/dominio/rutina/evitarRepeticionesExcesivas";
import { validarEquilibrioSemanal } from "@/lib/dominio/rutina/validarEquilibrioSemanal";
import { seleccionarEjerciciosFiltrados } from "@/lib/rutina/seleccionEjercicios";
import type { Ejercicio } from "@/tipos/ejercicio";
import type { Perfil } from "@/tipos/perfil";
import type {
  DiaRutinaSemanal,
  EjercicioRutinaSemanal,
} from "@/lib/dominio/rutina/tipos";

function reemplazarAislamientoSiExcesivo<T extends EjercicioRutinaSemanal>(
  dias: DiaRutinaSemanal<T>[],
  ejerciciosCatalogo: Ejercicio[],
  perfil: Perfil
): DiaRutinaSemanal<T>[] {
  return dias.map((dia) => ({
    ...dia,
    ejercicios: dia.ejercicios.map((ejercicio) => {
      if (ejercicio.patron_movimiento !== "aislamiento") {
        return ejercicio;
      }

      const alternativas = seleccionarEjerciciosFiltrados(ejerciciosCatalogo, {
        grupoMuscular: ejercicio.grupo_muscular,
        equipoDisponiblePerfil: perfil.equipo_disponible,
        molestiasPerfil: perfil.molestias,
      }).filter(
        (candidato) =>
          candidato.id !== ejercicio.id &&
          candidato.patron_movimiento !== "aislamiento"
      );

      const reemplazo = alternativas[0];

      if (!reemplazo) {
        return ejercicio;
      }

      return {
        ...ejercicio,
        id: reemplazo.id,
        nombre: reemplazo.nombre,
        grupo_muscular: reemplazo.grupo_muscular,
        patron_movimiento: reemplazo.patron_movimiento,
        dificultad: reemplazo.dificultad,
      };
    }),
  }));
}

export function aplicarCorreccionSemanal<T extends EjercicioRutinaSemanal>(
  dias: DiaRutinaSemanal<T>[],
  ejerciciosCatalogo: Ejercicio[],
  perfil: Perfil
): DiaRutinaSemanal<T>[] {
  let resultado = evitarRepeticionesExcesivas(
    dias,
    ejerciciosCatalogo,
    perfil,
    2
  );

  const alertas = validarEquilibrioSemanal(resultado);
  const hayExcesoAislamiento = alertas.some(
    (alerta) => alerta.tipo === "aislamiento_excesivo"
  );

  if (hayExcesoAislamiento) {
    resultado = reemplazarAislamientoSiExcesivo(
      resultado,
      ejerciciosCatalogo,
      perfil
    );
  }

  return resultado;
}