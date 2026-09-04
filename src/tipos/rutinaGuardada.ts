export type RutinaGuardada = {
  id: string;
  user_id: string;
  objetivo: string;
  nivel: string;
  dias_por_semana: number;
  indice_rotacion: number | null;
  created_at: string;
};

export type RutinaEjercicioGuardado = {
  id: string;
  rutina_id: string;
  ejercicio_id: string | null;
  dia: number;
  titulo_dia: string;
  nombre_ejercicio: string;
  grupo_muscular: string;
  series: number;
  repeticiones: string;
  created_at: string;
  ejercicios?:
  | {
    id: string;
    patron_movimiento: string | null;
    dificultad: string | null;
    equipamiento: string | null;
  }
  | {
    id: string;
    patron_movimiento: string | null;
    dificultad: string | null;
    equipamiento: string | null;
  }[]
  | null;
};