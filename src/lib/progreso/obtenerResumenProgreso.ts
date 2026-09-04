import { crearClienteSupabaseServer } from "@/lib/supabase/server";

export type ResumenGlobalProgreso = {
  sesionesTotales: number;
  ejerciciosTotales: number;
  seriesTotales: number;
  pesoTotalRegistrado: number;
  faciles: number;
  bien: number;
  dificiles: number;
};

export async function obtenerResumenProgreso(): Promise<ResumenGlobalProgreso> {
  const supabase = await crearClienteSupabaseServer();

  const {
    data: { user },
    error: errorUsuario,
  } = await supabase.auth.getUser();

  if (errorUsuario || !user) {
    return {
      sesionesTotales: 0,
      ejerciciosTotales: 0,
      seriesTotales: 0,
      pesoTotalRegistrado: 0,
      faciles: 0,
      bien: 0,
      dificiles: 0,
    };
  }

  const { data: sesiones, error: errorSesiones } = await supabase
    .from("sesiones_entrenamiento")
    .select("id")
    .eq("user_id", user.id);

  if (errorSesiones || !sesiones || sesiones.length === 0) {
    return {
      sesionesTotales: 0,
      ejerciciosTotales: 0,
      seriesTotales: 0,
      pesoTotalRegistrado: 0,
      faciles: 0,
      bien: 0,
      dificiles: 0,
    };
  }

  const sesionesIds = sesiones.map((sesion) => sesion.id);

  const { data: ejercicios, error: errorEjercicios } = await supabase
    .from("sesion_ejercicios")
    .select("series_reales, peso_usado, sensacion")
    .in("sesion_id", sesionesIds)
    .eq("completado", true);

  if (errorEjercicios || !ejercicios) {
    return {
      sesionesTotales: sesiones.length,
      ejerciciosTotales: 0,
      seriesTotales: 0,
      pesoTotalRegistrado: 0,
      faciles: 0,
      bien: 0,
      dificiles: 0,
    };
  }

  let seriesTotales = 0;
  let pesoTotalRegistrado = 0;
  let faciles = 0;
  let bien = 0;
  let dificiles = 0;

  for (const ejercicio of ejercicios) {
    seriesTotales += ejercicio.series_reales ?? 0;
    pesoTotalRegistrado += ejercicio.peso_usado ?? 0;

    if (ejercicio.sensacion === "facil") faciles++;
    if (ejercicio.sensacion === "bien") bien++;
    if (ejercicio.sensacion === "dificil") dificiles++;
  }

  return {
    sesionesTotales: sesiones.length,
    ejerciciosTotales: ejercicios.length,
    seriesTotales,
    pesoTotalRegistrado,
    faciles,
    bien,
    dificiles,
  };
}