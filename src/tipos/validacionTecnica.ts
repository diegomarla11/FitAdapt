export type EjercicioValidable =
  | "sentadilla"
  | "flexiones"
  | "hip_thrust"
  | "press_hombro"
  | "curl_biceps";

export type EstadoValidacionTecnica =
  | "correcto"
  | "aceptable"
  | "mejorable"
  | "no_evaluable";

export type ResultadoValidacionTecnica = {
  ejercicio: EjercicioValidable;
  puntuacion: number;
  estado: EstadoValidacionTecnica;
  mensajes: string[];
  framesAnalizados: number;
};

export type ResultadoEvaluadorTecnica = {
  puntuacion: number;
  estado: EstadoValidacionTecnica;
  mensajes: string[];
};

export type PuntoPose = {
  name: string;
  x: number;
  y: number;
  score?: number;
};