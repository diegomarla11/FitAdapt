import { crearClienteSupabaseServer } from "@/lib/supabase/server";

export type UltimoRegistroEjercicio = {
  ejercicio_id: string;
  series_reales: number | null;
  repeticiones_reales: string | null;
  peso_usado: number | null;
  sensacion: "facil" | "bien" | "dificil" | null;
  nivel_dolor: number | null;
  fatiga: number | null;
  created_at: string;
};

export async function obtenerUltimoRegistroPorEjercicio(
  ejercicioIds: string[]
): Promise<Map<string, UltimoRegistroEjercicio>> {
  if (ejercicioIds.length === 0) {
    return new Map();
  }

  const supabase = await crearClienteSupabaseServer();

  const {
    data: { user },
    error: errorUsuario,
  } = await supabase.auth.getUser();

  if (errorUsuario || !user) {
    return new Map();
  }

  const { data: sesiones, error: errorSesiones } = await supabase
    .from("sesiones_entrenamiento")
    .select("id")
    .eq("user_id", user.id);

  if (errorSesiones || !sesiones || sesiones.length === 0) {
    return new Map();
  }

  const sesionesIds = sesiones.map((sesion) => sesion.id);

  const { data, error } = await supabase
    .from("sesion_ejercicios")
    .select(`
      ejercicio_id,
      series_reales,
      repeticiones_reales,
      peso_usado,
      sensacion,
      nivel_dolor,
      fatiga,
      created_at
    `)
    .in("sesion_id", sesionesIds)
    .in("ejercicio_id", ejercicioIds)
    .eq("completado", true)
    .order("created_at", { ascending: false });

  if (error || !data) {
    return new Map();
  }

  const mapa = new Map<string, UltimoRegistroEjercicio>();

  for (const fila of data) {
    const ejercicioId = fila.ejercicio_id as string | null;

    if (!ejercicioId || mapa.has(ejercicioId)) {
      continue;
    }

    mapa.set(ejercicioId, {
      ejercicio_id: ejercicioId,
      series_reales: fila.series_reales,
      repeticiones_reales: fila.repeticiones_reales,
      peso_usado: fila.peso_usado,
      sensacion: fila.sensacion,
      nivel_dolor: fila.nivel_dolor,
      fatiga: fila.fatiga,
      created_at: fila.created_at,
    });
  }

  return mapa;
}