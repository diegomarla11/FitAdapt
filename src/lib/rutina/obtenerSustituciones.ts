import type { Ejercicio } from "@/tipos/ejercicio";
import { ordenarEjerciciosPorPuntuacion } from "@/lib/rutina/puntuarEjercicio";

type FiltrosSustitucion = {
  nombreEjercicioActual: string;
  grupoMuscular: string;
  patronMovimiento?: string | null;
  dificultad?: string;
  equipoDisponiblePerfil?: string | null;
  molestiasPerfil?: string | null;
  nombresYaUsados?: string[];
};

export function obtenerSustituciones(
  ejercicios: Ejercicio[],
  filtros: FiltrosSustitucion
) {
  const nombresExcluidos = [
    filtros.nombreEjercicioActual,
    ...(filtros.nombresYaUsados ?? []),
  ];

  const candidatosPuntuados = ordenarEjerciciosPorPuntuacion(ejercicios, {
    nombreEjercicioActual: filtros.nombreEjercicioActual,
    nombresExcluidos,
    grupoMuscular: filtros.grupoMuscular,
    patronMovimiento: filtros.patronMovimiento,
    dificultad: filtros.dificultad,
    equipoDisponiblePerfil: filtros.equipoDisponiblePerfil,
    molestiasPerfil: filtros.molestiasPerfil,
  });

  return candidatosPuntuados
    .filter((item) => item.puntuacion > 0)
    .map((item) => item.ejercicio);
}