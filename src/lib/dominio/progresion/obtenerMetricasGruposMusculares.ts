import { obtenerMetricasEjerciciosRecientes } from "@/lib/dominio/progresion/obtenerMetricasEjerciciosRecientes";

export type MetricasGrupoMuscular = {
  grupoMuscular: string;
  ejerciciosAnalizados: number;
  aparicionesTotales: number;
  cumplimientoMedio: number;
  ratioSeriesMedio: number;
  faciles: number;
  bien: number;
  dificiles: number;
  sensacionDominante: "facil" | "bien" | "dificil" | null;
};

function obtenerSensacionDominante(
  faciles: number,
  bien: number,
  dificiles: number
): "facil" | "bien" | "dificil" | null {
  if (faciles === 0 && bien === 0 && dificiles === 0) {
    return null;
  }

  if (faciles >= bien && faciles >= dificiles) {
    return "facil";
  }

  if (dificiles >= faciles && dificiles >= bien) {
    return "dificil";
  }

  return "bien";
}

export async function obtenerMetricasGruposMusculares(): Promise<
  Map<string, MetricasGrupoMuscular>
> {
  const metricasEjercicios = await obtenerMetricasEjerciciosRecientes();
  const mapa = new Map<string, MetricasGrupoMuscular>();

  for (const metrica of metricasEjercicios.values()) {
    const grupo = metrica.grupoMuscular;
    const actual = mapa.get(grupo);

    if (!actual) {
      mapa.set(grupo, {
        grupoMuscular: grupo,
        ejerciciosAnalizados: 1,
        aparicionesTotales: metrica.apariciones,
        cumplimientoMedio: metrica.cumplimiento,
        ratioSeriesMedio: metrica.ratioSeries,
        faciles: metrica.faciles,
        bien: metrica.bien,
        dificiles: metrica.dificiles,
        sensacionDominante: obtenerSensacionDominante(
          metrica.faciles,
          metrica.bien,
          metrica.dificiles
        ),
      });
      continue;
    }

    actual.ejerciciosAnalizados += 1;
    actual.aparicionesTotales += metrica.apariciones;
    actual.cumplimientoMedio += metrica.cumplimiento;
    actual.ratioSeriesMedio += metrica.ratioSeries;
    actual.faciles += metrica.faciles;
    actual.bien += metrica.bien;
    actual.dificiles += metrica.dificiles;
    actual.sensacionDominante = obtenerSensacionDominante(
      actual.faciles,
      actual.bien,
      actual.dificiles
    );
  }

  for (const actual of mapa.values()) {
    if (actual.ejerciciosAnalizados > 0) {
      actual.cumplimientoMedio =
        actual.cumplimientoMedio / actual.ejerciciosAnalizados;
      actual.ratioSeriesMedio =
        actual.ratioSeriesMedio / actual.ejerciciosAnalizados;
    }
  }

  return mapa;
}