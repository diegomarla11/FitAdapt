type DatosPerfilValidables = {
  objetivo: string;
  nivel: string;
  dias_por_semana: number;
  duracion_sesion: number;
  equipo_disponible: string;
};

export function validarDatosPerfil(datos: DatosPerfilValidables) {
  if (!datos.objetivo.trim()) {
    return "Selecciona un objetivo.";
  }

  if (!datos.nivel.trim()) {
    return "Selecciona un nivel.";
  }

  if (!Number.isFinite(datos.dias_por_semana)) {
    return "Indica los días por semana.";
  }

  if (datos.dias_por_semana < 1 || datos.dias_por_semana > 7) {
    return "Los días por semana deben estar entre 1 y 7.";
  }

  if (!Number.isFinite(datos.duracion_sesion)) {
    return "Indica la duración de la sesión.";
  }

  if (datos.duracion_sesion < 15 || datos.duracion_sesion > 180) {
    return "La duración por sesión debe estar entre 15 y 180 minutos.";
  }

  if (!datos.equipo_disponible.trim()) {
    return "Selecciona al menos un equipo disponible.";
  }

  return null;
}