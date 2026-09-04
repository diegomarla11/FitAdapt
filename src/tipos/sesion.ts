// Tipos de persistencia asociados a sesiones y ejercicios guardados en base de datos.

export type SesionEntrenamiento = {
  id: string;
  rutina_id: string | null;
  user_id: string;
  dia: number;
  titulo_dia: string;
  fecha: string;
  nota_sesion: string | null;
  created_at: string;
};

export type SesionEjercicio = {
  id: string;
  sesion_id: string;
  ejercicio_id: string | null;
  nombre_ejercicio: string;
  grupo_muscular: string;
  series_planeadas: number;
  repeticiones_planeadas: string;
  series_reales: number | null;
  repeticiones_reales: string | null;
  peso_usado: number | null;
  sensacion: "facil" | "bien" | "dificil" | null;
  estado_resultado: "completado" | "parcial" | "superado" | null;
  completado: boolean;
  created_at: string;
};