export type Ejercicio = {
  id: string;
  nombre: string;
  grupo_muscular: string;
  patron_movimiento: string | null;
  equipamiento: string | null;
  dificultad: string | null;
  descripcion: string | null;
  instrucciones: string | null;
  errores_comunes: string | null;
  ajustes: string | null;
  recomendaciones_nivel: string | null;
  variantes: string | null;
  contraindicaciones: string | null;
  imagen_url: string | null;
  created_at?: string;
};