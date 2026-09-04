export type EjercicioRutinaSemanal = {
  id: string;
  nombre: string;
  grupo_muscular: string;
  patron_movimiento?: string | null;
  dificultad?: string | null;
  series: number;
  repeticiones: string;
};

export type DiaRutinaSemanal<T = EjercicioRutinaSemanal> = {
  dia: number;
  titulo: string;
  ejercicios: T[];
};

export type ConteoSemanal = {
  porEjercicio: Map<string, number>;
  porGrupoMuscular: Map<string, number>;
  porPatron: Map<string, number>;
};