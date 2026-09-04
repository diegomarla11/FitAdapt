import {
  obtenerMetricasGruposMusculares,
  type MetricasGrupoMuscular,
} from "@/lib/dominio/progresion/obtenerMetricasGruposMusculares";

export type AjusteGrupoMuscular = {
  grupoMuscular: string;
  accion: "mantener" | "reducir_volumen" | "aumentar_volumen";
  motivo: string;
};

function decidirAjusteGrupo(
  metrica: MetricasGrupoMuscular
): AjusteGrupoMuscular {
  if (
    metrica.sensacionDominante === "dificil" &&
    metrica.ratioSeriesMedio < 0.9
  ) {
    return {
      grupoMuscular: metrica.grupoMuscular,
      accion: "reducir_volumen",
      motivo:
        "Sensación dominante difícil y ratio medio de series por debajo de lo esperado.",
    };
  }

  if (
    metrica.sensacionDominante === "facil" &&
    metrica.cumplimientoMedio >= 0.85 &&
    metrica.ratioSeriesMedio >= 0.95
  ) {
    return {
      grupoMuscular: metrica.grupoMuscular,
      accion: "aumentar_volumen",
      motivo:
        "Grupo con buen cumplimiento, series estables y sensación dominante fácil.",
    };
  }

  return {
    grupoMuscular: metrica.grupoMuscular,
    accion: "mantener",
    motivo: "No hay evidencia suficiente para modificar el volumen del grupo.",
  };
}

export async function obtenerAjustesGruposMusculares(): Promise<
  Map<string, AjusteGrupoMuscular>
> {
  const metricas = await obtenerMetricasGruposMusculares();
  const ajustes = new Map<string, AjusteGrupoMuscular>();

  for (const metrica of metricas.values()) {
    ajustes.set(metrica.grupoMuscular, decidirAjusteGrupo(metrica));
  }

  return ajustes;
}