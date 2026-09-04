// Tipos de UI y estado para la pantalla de entrenamiento.

export type UltimoRegistroEjercicio = {
  series_reales: number | null;
  repeticiones_reales: string | null;
  peso_usado: number | null;
  sensacion: "facil" | "bien" | "dificil" | null;
  nivel_dolor: number | null;
  fatiga: number | null;
} | null;

export type EjercicioDiaEntrenamiento = {
  id: string;
  nombre: string;
  grupo_muscular: string;
  series: number;
  repeticiones: string;
  ultimoRegistro: UltimoRegistroEjercicio;
};

export type DiaEntrenamiento = {
  dia: number;
  titulo: string;
  ejercicios: EjercicioDiaEntrenamiento[];
};

export type SesionEjercicioGuardada = {
  id: string;
  sesion_id: string;
  ejercicio_id: string | null;
  nombre_ejercicio: string;
  grupo_muscular: string;
  series_planeadas: number;
  repeticiones_planeadas: string;
  completado: boolean;
  created_at: string;
  series_reales: number | null;
  repeticiones_reales: string | null;
  peso_usado: number | null;
  sensacion: "facil" | "bien" | "dificil" | null;
  estado_resultado: "completado" | "parcial" | "superado" | null;
  nivel_dolor: number | null;
  fatiga: number | null;
  descanso_recomendado: number | null;
  descanso_real: number | null;
  motivo_parcial: string | null;
};

export type SesionGuardada = {
  id: string;
  rutina_id: string | null;
  dia: number;
  titulo_dia: string;
  fecha: string;
  nota_sesion: string | null;
  created_at: string;
  sesion_ejercicios: SesionEjercicioGuardada[];
};

export type DatosRealesEjercicio = {
  estado: "completado" | "parcial" | "superado";
  seriesReales: string;
  repeticionesReales: string;
  pesoUsado: string;
  sensacion: "facil" | "bien" | "dificil" | "";
  nivelDolor: string;
  fatiga: string;
  descansoRecomendado: string;
  descansoReal: string;
  motivoParcial: string;
};

export type DatosReales = Record<string, DatosRealesEjercicio>;