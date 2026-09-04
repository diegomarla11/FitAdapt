import { obtenerUltimaRutinaGuardada } from "@/lib/rutina/obtenerUltimaRutina";
import { obtenerUltimoRegistroPorEjercicio } from "@/lib/entrenamiento/obtenerUltimoRegistroPorEjercicio";

export async function obtenerEntrenamientoActual() {
  const resultado = await obtenerUltimaRutinaGuardada();

  if (!resultado) {
    return null;
  }
  if (resultado.ejercicios.length === 0) {
    return null;
  }

  const ejercicioIds = resultado.ejercicios
    .map((ejercicio) => ejercicio.ejercicio_id)
    .filter((id): id is string => Boolean(id));

  const ultimosRegistros = await obtenerUltimoRegistroPorEjercicio(
    ejercicioIds
  );

  const diasMap = new Map<
    number,
    {
      dia: number;
      titulo: string;
      ejercicios: {
        id: string;
        nombre: string;
        grupo_muscular: string;
        series: number;
        repeticiones: string;
        ultimoRegistro: {
          series_reales: number | null;
          repeticiones_reales: string | null;
          peso_usado: number | null;
          sensacion: "facil" | "bien" | "dificil" | null;
          nivel_dolor: number | null;
          fatiga: number | null;
        } | null;
      }[];
    }
  >();

  for (const ejercicio of resultado.ejercicios) {
    if (!diasMap.has(ejercicio.dia)) {
      diasMap.set(ejercicio.dia, {
        dia: ejercicio.dia,
        titulo: ejercicio.titulo_dia,
        ejercicios: [],
      });
    }

    const diaActual = diasMap.get(ejercicio.dia);

    if (diaActual) {
      const ejercicioIdReal = ejercicio.ejercicio_id ?? ejercicio.id;
      const ultimoRegistro = ultimosRegistros.get(ejercicioIdReal) ?? null;

      diaActual.ejercicios.push({
        id: ejercicioIdReal,
        nombre: ejercicio.nombre_ejercicio,
        grupo_muscular: ejercicio.grupo_muscular,
        series: ejercicio.series,
        repeticiones: ejercicio.repeticiones,
        ultimoRegistro: ultimoRegistro
          ? {
            series_reales: ultimoRegistro.series_reales,
            repeticiones_reales: ultimoRegistro.repeticiones_reales,
            peso_usado: ultimoRegistro.peso_usado,
            sensacion: ultimoRegistro.sensacion,
            nivel_dolor: ultimoRegistro.nivel_dolor,
            fatiga: ultimoRegistro.fatiga,
          }
          : null,
      });
    }
  }

  const dias = Array.from(diasMap.values()).sort((a, b) => a.dia - b.dia);

  return {
    rutina: resultado.rutina,
    dias,
  };
}