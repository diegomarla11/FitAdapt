export type Perfil = {
  id: string;
  user_id: string;
  nombre: string;
  objetivo: string;
  nivel: string;
  dias_por_semana: number;
  duracion_sesion: number;
  equipo_disponible: string | null;
  molestias: string | null;
  created_at: string;
  updated_at: string | null;
};