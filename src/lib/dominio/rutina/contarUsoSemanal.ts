import type {
  ConteoSemanal,
  DiaRutinaSemanal,
  EjercicioRutinaSemanal,
} from "@/lib/dominio/rutina/tipos";

export function contarUsoSemanal<T extends EjercicioRutinaSemanal>(
  dias: DiaRutinaSemanal<T>[]
): ConteoSemanal {
  const porEjercicio = new Map<string, number>();
  const porGrupoMuscular = new Map<string, number>();
  const porPatron = new Map<string, number>();

  for (const dia of dias) {
    for (const ejercicio of dia.ejercicios) {
      porEjercicio.set(ejercicio.id, (porEjercicio.get(ejercicio.id) ?? 0) + 1);

      porGrupoMuscular.set(
        ejercicio.grupo_muscular,
        (porGrupoMuscular.get(ejercicio.grupo_muscular) ?? 0) + 1
      );

      const patron = ejercicio.patron_movimiento ?? "sin_patron";
      porPatron.set(patron, (porPatron.get(patron) ?? 0) + 1);
    }
  }

  return {
    porEjercicio,
    porGrupoMuscular,
    porPatron,
  };
}