export type TipoAccionProgresion =
  | "mantener"
  | "subir_series"
  | "bajar_series"
  | "subir_dificultad"
  | "bajar_dificultad"
  | "cambiar_variante";

export type ExplicacionProgresion = {
  accion: TipoAccionProgresion;
  estado:
    | "muy_bien"
    | "bien"
    | "neutro"
    | "fatiga"
    | "bajo_rendimiento"
    | "dolor"
    | "sin_datos";
  motivo: string;
  seriesOriginales: number;
  seriesFinales: number;
  nombreOriginal: string;
  nombreFinal: string;
};

export type ExplicacionSeleccion = {
  motivo: string;
  coincidencias: string[];
};

export type EjercicioRutina = {
  id: string;
  nombre: string;
  grupo_muscular: string;
  patron_movimiento: string | null;
  dificultad?: string | null;
  series: number;
  repeticiones: string;
  explicacion_progresion?: ExplicacionProgresion | null;
  explicacion_seleccion?: ExplicacionSeleccion | null;
};

export type DiaRutina = {
  dia: number;
  titulo: string;
  ejercicios: EjercicioRutina[];
};

export type RutinaGenerada = {
  objetivo: string;
  nivel: string;
  dias_por_semana: number;
  indice_rotacion: number;
  dias: DiaRutina[];
};