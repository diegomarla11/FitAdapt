import type { Perfil } from "@/tipos/perfil";
import type { RutinaGuardada } from "@/tipos/rutinaGuardada";

export function comprobarRutinaDesactualizada(
  perfil: Perfil | null,
  rutina: RutinaGuardada | null
) {
  if (!perfil || !rutina) {
    return false;
  }

  if (!perfil.updated_at || !rutina.created_at) {
    return false;
  }

  const fechaPerfil = new Date(perfil.updated_at).getTime();
  const fechaRutina = new Date(rutina.created_at).getTime();

  return fechaPerfil > fechaRutina;
}