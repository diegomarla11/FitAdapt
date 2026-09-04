import { obtenerMetricasGruposMusculares } from "@/lib/dominio/progresion/obtenerMetricasGruposMusculares";

export type ResumenGrupoMuscularProgreso = {
  grupoMuscular: string;
  ejerciciosAnalizados: number;
  aparicionesTotales: number;
  cumplimientoMedio: number;
  ratioSeriesMedio: number;
  sensacionDominante: "facil" | "bien" | "dificil" | null;
};

export async function obtenerResumenPorGrupoMuscular(): Promise<
  ResumenGrupoMuscularProgreso[]
> {
  const metricas = await obtenerMetricasGruposMusculares();

  return Array.from(metricas.values())
    .map((metrica) => ({
      grupoMuscular: metrica.grupoMuscular,
      ejerciciosAnalizados: metrica.ejerciciosAnalizados,
      aparicionesTotales: metrica.aparicionesTotales,
      cumplimientoMedio: metrica.cumplimientoMedio,
      ratioSeriesMedio: metrica.ratioSeriesMedio,
      sensacionDominante: metrica.sensacionDominante,
    }))
    .sort((a, b) => b.aparicionesTotales - a.aparicionesTotales);
}