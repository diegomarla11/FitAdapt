export type SensacionEjercicio = "facil" | "bien" | "dificil";

export type RegistroEjercicioReciente = {
  ejercicioId: string;
  nombreEjercicio: string;
  grupoMuscular: string;
  sesionId: string;
  fecha: string;
  seriesPlaneadas: number;
  repeticionesPlaneadas: string;
  seriesReales: number | null;
  repeticionesReales: string | null;
  pesoUsado: number | null;
  sensacion: SensacionEjercicio | null;
  nivelDolor: number | null;
  fatiga: number | null;
  descansoRecomendado: number | null;
  descansoReal: number | null;
  completado: boolean;
};

export type MetricasEjercicioReciente = {
  ejercicioId: string;
  nombreEjercicio: string;
  grupoMuscular: string;
  apariciones: number;
  completados: number;
  cumplimiento: number;
  seriesPlaneadasTotales: number;
  seriesRealesTotales: number;
  ratioSeries: number;
  pesoMedio: number | null;
  sensacionDominante: SensacionEjercicio | null;
  faciles: number;
  bien: number;
  dificiles: number;
  dolorMedio: number | null;
  dolorMaximo: number;
  fatigaMedia: number | null;
  descansoRecomendadoMedio: number | null;
  descansoRealMedio: number | null;
  ratioDescanso: number | null;
  ultimoRegistro: RegistroEjercicioReciente | null;
};

export type EstadoRendimientoEjercicio =
  | "muy_bien"
  | "bien"
  | "neutro"
  | "fatiga"
  | "bajo_rendimiento"
  | "dolor"
  | "sin_datos";

export type AjusteEjercicio = {
  ejercicioId: string;
  nombreEjercicio: string;
  grupoMuscular: string;
  estado: EstadoRendimientoEjercicio;
  accion:
    | "mantener"
    | "subir_series"
    | "bajar_series"
    | "subir_dificultad"
    | "bajar_dificultad"
    | "cambiar_variante";
  deltaSeries: number;
  motivo: string;
};