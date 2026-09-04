import { crearClienteSupabaseServer } from "@/lib/supabase/server";
import { obtenerResumenProgreso } from "@/lib/progreso/obtenerResumenProgreso";
import { obtenerResumenPorGrupoMuscular } from "@/lib/progreso/obtenerResumenPorGrupoMuscular";
import { obtenerResumenPorEjercicio } from "@/lib/progreso/obtenerResumenPorEjercicio";
import { obtenerEvolucionProgreso } from "@/lib/progreso/obtenerEvolucionProgreso";

export async function obtenerDatosProgreso() {
  const supabase = await crearClienteSupabaseServer();

  const {
    data: { user },
    error: errorUsuario,
  } = await supabase.auth.getUser();

  if (errorUsuario || !user) {
    return {
      resumenGlobal: null,
      resumenPorGrupo: [],
      resumenPorEjercicio: [],
      evolucionProgreso: [],
      ultimasSesiones: [],
    };
  }

  const resumenGlobal = await obtenerResumenProgreso();
  const resumenPorGrupo = await obtenerResumenPorGrupoMuscular();
  const resumenPorEjercicio = await obtenerResumenPorEjercicio();
  const evolucionProgreso = await obtenerEvolucionProgreso();

  const { data: ultimasSesiones } = await supabase
    .from("sesiones_entrenamiento")
    .select("id, fecha, titulo_dia, nota_sesion, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(8);

  return {
    resumenGlobal,
    resumenPorGrupo,
    resumenPorEjercicio,
    evolucionProgreso,
    ultimasSesiones: ultimasSesiones ?? [],
  };
}