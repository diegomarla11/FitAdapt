import type { Ejercicio } from "@/tipos/ejercicio";
import {
  esCompatibleConEquipamiento,
  obtenerEquipamientosPerfil,
} from "@/lib/shared/equipamiento";

import {
  obtenerMolestiasDetectadas,
  patronBloqueadoPorMolestia,
} from "@/lib/shared/molestias";

import { ordenarEjerciciosPorPuntuacion } from "@/lib/rutina/puntuarEjercicio";

type FiltrosEjercicio = {
  grupoMuscular?: string;
  patronMovimiento?: string;
  dificultad?: string;
  equipoDisponiblePerfil?: string | null;
  molestiasPerfil?: string | null;
};

export function filtrarEjercicios(
  ejercicios: Ejercicio[],
  filtros: FiltrosEjercicio
) {
  const equipamientosPerfil = obtenerEquipamientosPerfil(
    filtros.equipoDisponiblePerfil ?? null
  );

  const molestiasDetectadas = obtenerMolestiasDetectadas(
    filtros.molestiasPerfil ?? null
  );

  return ejercicios.filter((ejercicio) => {
    const cumpleGrupo =
      !filtros.grupoMuscular ||
      ejercicio.grupo_muscular === filtros.grupoMuscular;

    const cumplePatron =
      !filtros.patronMovimiento ||
      ejercicio.patron_movimiento === filtros.patronMovimiento;

    const cumpleDificultad =
      !filtros.dificultad || ejercicio.dificultad === filtros.dificultad;

    const cumpleEquipamiento = esCompatibleConEquipamiento(
      ejercicio.equipamiento,
      equipamientosPerfil
    );

    const bloqueadoPorMolestia = patronBloqueadoPorMolestia(
      ejercicio.patron_movimiento ?? undefined,
      molestiasDetectadas
    );

    return (
      cumpleGrupo &&
      cumplePatron &&
      cumpleDificultad &&
      cumpleEquipamiento &&
      !bloqueadoPorMolestia
    );
  });
}

export function obtenerEjercicioPorRotacion(
  ejercicios: Ejercicio[],
  filtros: FiltrosEjercicio,
  indiceRotacion: number
) {
  const opcionesPuntuadas = ordenarEjerciciosPorPuntuacion(ejercicios, {
    grupoMuscular: filtros.grupoMuscular,
    patronMovimiento: filtros.patronMovimiento,
    dificultad: filtros.dificultad,
    equipoDisponiblePerfil: filtros.equipoDisponiblePerfil,
    molestiasPerfil: filtros.molestiasPerfil,
  }).filter((item) => item.puntuacion > 0);

  if (opcionesPuntuadas.length === 0) {
    return null;
  }

  const indice = indiceRotacion % opcionesPuntuadas.length;

  return opcionesPuntuadas[indice].ejercicio;
}

export function seleccionarEjerciciosFiltrados(
  ejercicios: Ejercicio[],
  filtros: FiltrosEjercicio
): Ejercicio[] {
  return ordenarEjerciciosPorPuntuacion(ejercicios, {
    grupoMuscular: filtros.grupoMuscular,
    patronMovimiento: filtros.patronMovimiento,
    dificultad: filtros.dificultad,
    equipoDisponiblePerfil: filtros.equipoDisponiblePerfil,
    molestiasPerfil: filtros.molestiasPerfil,
  })
    .filter((item) => item.puntuacion > 0)
    .map((item) => item.ejercicio);
}