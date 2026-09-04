import { crearClienteSupabaseServer } from "@/lib/supabase/server";
import type { SesionGuardada } from "@/tipos/entrenamiento";

export async function obtenerSesionesRutina(
  rutinaId: string | null
): Promise<SesionGuardada[]> {
  if (!rutinaId) {
    return [];
  }

  const supabase = await crearClienteSupabaseServer();

  const {
    data: { user },
    error: errorUsuario,
  } = await supabase.auth.getUser();

  if (errorUsuario || !user) {
    return [];
  }

  const { data, error } = await supabase
    .from("sesiones_entrenamiento")
    .select(`
      id,
      rutina_id,
      user_id,
      dia,
      titulo_dia,
      fecha,
      nota_sesion,
      created_at,
      sesion_ejercicios (
        id,
        sesion_id,
        ejercicio_id,
        nombre_ejercicio,
        grupo_muscular,
        series_planeadas,
        repeticiones_planeadas,
        series_reales,
        repeticiones_reales,
        peso_usado,
        sensacion,
        estado_resultado,
        nivel_dolor,
        fatiga,
        descanso_recomendado,
        descanso_real,
        motivo_parcial,
        completado,
        created_at
      )
    `)
    .eq("rutina_id", rutinaId)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data as SesionGuardada[];
}