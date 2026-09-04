import type {
  DiaRutinaSemanal,
  EjercicioRutinaSemanal,
} from "@/lib/dominio/rutina/tipos";
import { contarUsoSemanal } from "@/lib/dominio/rutina/contarUsoSemanal";

export type AlertaEquilibrioSemanal = {
  tipo:
    | "grupo_sobrecargado"
    | "patron_desequilibrado"
    | "aislamiento_excesivo";
  clave: string;
  mensaje: string;
};

export function validarEquilibrioSemanal<T extends EjercicioRutinaSemanal>(
  dias: DiaRutinaSemanal<T>[]
): AlertaEquilibrioSemanal[] {
  const alertas: AlertaEquilibrioSemanal[] = [];
  const conteo = contarUsoSemanal(dias);

  for (const [grupo, usos] of conteo.porGrupoMuscular.entries()) {
    if (usos >= 5) {
      alertas.push({
        tipo: "grupo_sobrecargado",
        clave: grupo,
        mensaje: `El grupo muscular ${grupo} aparece con mucha frecuencia en la semana.`,
      });
    }
  }

  const aislamientos = conteo.porPatron.get("aislamiento") ?? 0;
  const totalPatrones = Array.from(conteo.porPatron.values()).reduce(
    (acc, valor) => acc + valor,
    0
  );

  if (totalPatrones > 0 && aislamientos / totalPatrones > 0.45) {
    alertas.push({
      tipo: "aislamiento_excesivo",
      clave: "aislamiento",
      mensaje: "Hay un exceso de ejercicios de aislamiento en la rutina semanal.",
    });
  }

  const empujeHorizontal = conteo.porPatron.get("empuje horizontal") ?? 0;
  const tironHorizontal = conteo.porPatron.get("tiron horizontal") ?? 0;
  const dominanteRodilla = conteo.porPatron.get("dominante de rodilla") ?? 0;
  const dominanteCadera = conteo.porPatron.get("dominante de cadera") ?? 0;

  if (Math.abs(empujeHorizontal - tironHorizontal) >= 2) {
    alertas.push({
      tipo: "patron_desequilibrado",
      clave: "empuje_tiron_horizontal",
      mensaje:
        "Hay desequilibrio entre empuje horizontal y tirón horizontal.",
    });
  }

  if (Math.abs(dominanteRodilla - dominanteCadera) >= 2) {
    alertas.push({
      tipo: "patron_desequilibrado",
      clave: "rodilla_cadera",
      mensaje: "Hay desequilibrio entre dominante de rodilla y de cadera.",
    });
  }

  return alertas;
}