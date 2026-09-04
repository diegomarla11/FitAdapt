import { seleccionarEjerciciosFiltrados } from "@/lib/rutina/seleccionEjercicios";
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
};

type ObjetivoVariante =
  | "mantener"
  | "bajar_dificultad"
  | "subir_dificultad"
  | "dolor"
  | "fatiga";

function normalizarTexto(valor?: string | null) {
  return valor?.trim().toLowerCase() ?? "";
}

function esMismoEjercicio(candidato: Ejercicio, ejercicioActual: EjercicioRutina) {
  return (
    candidato.id === ejercicioActual.id ||
    normalizarTexto(candidato.nombre) === normalizarTexto(ejercicioActual.nombre)
  );
}

function obtenerDificultadObjetivo(
  objetivo: ObjetivoVariante,
  dificultadActual?: string | null
) {
  if (objetivo === "bajar_dificultad" || objetivo === "fatiga") {
    return "principiante";
  }

  if (objetivo === "subir_dificultad") {
    if (dificultadActual === "principiante") {
      return "intermedio";
    }

    return "avanzado";
  }

  return undefined;
}

function puntuarDificultadParaDolor(dificultad?: string | null) {
  if (dificultad === "principiante") return 5;
  if (dificultad === "intermedio") return 3;
  if (dificultad === "avanzado") return 1;
  return 2;
}

function puntuarCandidato(
  candidato: Ejercicio,
  ejercicioActual: EjercicioRutina,
  objetivo: ObjetivoVariante
) {
  let puntuacion = 0;

  if (candidato.grupo_muscular === ejercicioActual.grupo_muscular) {
    puntuacion += 10;
  }

  if (objetivo === "dolor") {
    puntuacion += puntuarDificultadParaDolor(candidato.dificultad);

    if (candidato.patron_movimiento !== ejercicioActual.patron_movimiento) {
      puntuacion += 4;
    }

    if (candidato.patron_movimiento === ejercicioActual.patron_movimiento) {
      puntuacion -= 2;
    }

    if (candidato.contraindicaciones?.trim()) {
      puntuacion -= 2;
    }

    return puntuacion;
  }

  if (candidato.patron_movimiento === ejercicioActual.patron_movimiento) {
    puntuacion += 4;
  }

  if (objetivo === "fatiga" || objetivo === "bajar_dificultad") {
    if (candidato.dificultad === "principiante") {
      puntuacion += 5;
    }
  }

  if (objetivo === "subir_dificultad") {
    if (candidato.dificultad === "intermedio") {
      puntuacion += 3;
    }

    if (candidato.dificultad === "avanzado") {
      puntuacion += 4;
    }
  }

  return puntuacion;
}

function ordenarCandidatos(
  candidatos: Ejercicio[],
  ejercicioActual: EjercicioRutina,
  objetivo: ObjetivoVariante
) {
  return [...candidatos].sort(
    (a, b) =>
      puntuarCandidato(b, ejercicioActual, objetivo) -
      puntuarCandidato(a, ejercicioActual, objetivo)
  );
}

function buscarCandidatos(
  ejercicioActual: EjercicioRutina,
  ejerciciosCatalogo: Ejercicio[],
  perfil: Perfil,
  objetivo: ObjetivoVariante,
  usarPatron: boolean,
  usarDificultad: boolean
) {
  const candidatos = seleccionarEjerciciosFiltrados(ejerciciosCatalogo, {
    grupoMuscular: ejercicioActual.grupo_muscular,
    patronMovimiento: usarPatron
      ? ejercicioActual.patron_movimiento ?? undefined
      : undefined,
    dificultad: usarDificultad
      ? obtenerDificultadObjetivo(objetivo, ejercicioActual.dificultad)
      : undefined,
    equipoDisponiblePerfil: perfil.equipo_disponible,
    molestiasPerfil: perfil.molestias,
  }).filter((candidato) => !esMismoEjercicio(candidato, ejercicioActual));

  return ordenarCandidatos(candidatos, ejercicioActual, objetivo);
}

export function resolverCambioVariante(
  ejercicioActual: EjercicioRutina,
  ejerciciosCatalogo: Ejercicio[],
  perfil: Perfil,
  objetivo: ObjetivoVariante
): EjercicioRutina {
  const intentos: Ejercicio[][] = [];

  if (objetivo === "dolor") {
    intentos.push(
      buscarCandidatos(
        ejercicioActual,
        ejerciciosCatalogo,
        perfil,
        objetivo,
        false,
        false
      )
    );
  } else {
    intentos.push(
      buscarCandidatos(
        ejercicioActual,
        ejerciciosCatalogo,
        perfil,
        objetivo,
        true,
        true
      )
    );

    intentos.push(
      buscarCandidatos(
        ejercicioActual,
        ejerciciosCatalogo,
        perfil,
        objetivo,
        true,
        false
      )
    );

    intentos.push(
      buscarCandidatos(
        ejercicioActual,
        ejerciciosCatalogo,
        perfil,
        objetivo,
        false,
        true
      )
    );

    intentos.push(
      buscarCandidatos(
        ejercicioActual,
        ejerciciosCatalogo,
        perfil,
        objetivo,
        false,
        false
      )
    );
  }

  const mejor = intentos.flat()[0];

  if (!mejor) {
    return ejercicioActual;
  }

  return {
    ...ejercicioActual,
    id: mejor.id,
    nombre: mejor.nombre,
    grupo_muscular: mejor.grupo_muscular,
    patron_movimiento: mejor.patron_movimiento,
    dificultad: mejor.dificultad,
  };
}