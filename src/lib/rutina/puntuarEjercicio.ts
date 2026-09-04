import type { Ejercicio } from "@/tipos/ejercicio";
import {
  esCompatibleConEquipamiento,
  obtenerEquipamientosPerfil,
} from "@/lib/shared/equipamiento";
import {
  obtenerMolestiasDetectadas,
  patronBloqueadoPorMolestia,
} from "@/lib/shared/molestias";

type CriteriosPuntuacionEjercicio = {
  grupoMuscular?: string;
  patronMovimiento?: string | null;
  dificultad?: string | null;
  equipoDisponiblePerfil?: string | null;
  molestiasPerfil?: string | null;
  nombresExcluidos?: string[];
  nombreEjercicioActual?: string;
};

export type EjercicioPuntuado = {
  ejercicio: Ejercicio;
  puntuacion: number;
  motivos: string[];
};

function normalizarTexto(valor: string | null | undefined) {
  return valor?.trim().toLowerCase() ?? "";
}

function obtenerDistanciaDificultad(
  dificultadEjercicio: string | null | undefined,
  dificultadObjetivo: string | null | undefined
) {
  if (!dificultadObjetivo) {
    return 0;
  }

  const niveles = ["principiante", "intermedio", "avanzado"];

  const indiceEjercicio = niveles.indexOf(normalizarTexto(dificultadEjercicio));
  const indiceObjetivo = niveles.indexOf(normalizarTexto(dificultadObjetivo));

  if (indiceEjercicio === -1 || indiceObjetivo === -1) {
    return 2;
  }

  return Math.abs(indiceEjercicio - indiceObjetivo);
}

export function puntuarEjercicio(
  ejercicio: Ejercicio,
  criterios: CriteriosPuntuacionEjercicio
): EjercicioPuntuado | null {
  const equipamientosPerfil = obtenerEquipamientosPerfil(
    criterios.equipoDisponiblePerfil ?? null
  );

  const molestiasDetectadas = obtenerMolestiasDetectadas(
    criterios.molestiasPerfil ?? null
  );

  const nombresExcluidosNormalizados = new Set(
    (criterios.nombresExcluidos ?? []).map((nombre) => normalizarTexto(nombre))
  );

  const nombreEjercicio = normalizarTexto(ejercicio.nombre);

  if (criterios.nombreEjercicioActual) {
    const nombreActual = normalizarTexto(criterios.nombreEjercicioActual);

    if (nombreEjercicio === nombreActual) {
      return null;
    }
  }

  if (nombresExcluidosNormalizados.has(nombreEjercicio)) {
    return null;
  }

  const cumpleEquipamiento = esCompatibleConEquipamiento(
    ejercicio.equipamiento,
    equipamientosPerfil
  );

  if (!cumpleEquipamiento) {
    return null;
  }

  const bloqueadoPorMolestia = patronBloqueadoPorMolestia(
    ejercicio.patron_movimiento ?? undefined,
    molestiasDetectadas
  );

  if (bloqueadoPorMolestia) {
    return null;
  }

  let puntuacion = 0;
  const motivos: string[] = [];

  if (
    criterios.grupoMuscular &&
    ejercicio.grupo_muscular === criterios.grupoMuscular
  ) {
    puntuacion += 40;
    motivos.push("Coincide con el grupo muscular solicitado.");
  } else if (criterios.grupoMuscular) {
    puntuacion -= 50;
  }

  if (
    criterios.patronMovimiento &&
    ejercicio.patron_movimiento === criterios.patronMovimiento
  ) {
    puntuacion += 30;
    motivos.push("Mantiene el mismo patrón de movimiento.");
  } else if (criterios.patronMovimiento) {
    puntuacion -= 15;
  }

  puntuacion += 20;
  motivos.push("Compatible con el equipamiento disponible.");

  const distanciaDificultad = obtenerDistanciaDificultad(
    ejercicio.dificultad,
    criterios.dificultad
  );

  if (criterios.dificultad) {
    if (distanciaDificultad === 0) {
      puntuacion += 15;
      motivos.push("Coincide con la dificultad objetivo.");
    }

    if (distanciaDificultad === 1) {
      puntuacion += 5;
      motivos.push("Tiene una dificultad cercana a la objetivo.");
    }

    if (distanciaDificultad >= 2) {
      puntuacion -= 10;
    }
  }

  if (ejercicio.descripcion?.trim()) {
    puntuacion += 3;
  }

  if (ejercicio.instrucciones?.trim()) {
    puntuacion += 3;
  }

  if (ejercicio.errores_comunes?.trim()) {
    puntuacion += 2;
  }

  return {
    ejercicio,
    puntuacion,
    motivos,
  };
}

export function ordenarEjerciciosPorPuntuacion(
  ejercicios: Ejercicio[],
  criterios: CriteriosPuntuacionEjercicio
) {
  return ejercicios
    .map((ejercicio) => puntuarEjercicio(ejercicio, criterios))
    .filter((item): item is EjercicioPuntuado => item !== null)
    .sort((a, b) => b.puntuacion - a.puntuacion);
}