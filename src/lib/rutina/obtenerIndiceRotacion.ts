import { crearClienteSupabaseServer } from "@/lib/supabase/server";

export async function obtenerSiguienteIndiceRotacion() {
  const supabase = await crearClienteSupabaseServer();

  const {
    data: { user },
    error: errorUsuario,
  } = await supabase.auth.getUser();

  if (errorUsuario || !user) {
    return 0;
  }

  const { data, error } = await supabase
    .from("rutinas")
    .select("indice_rotacion")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return 0;
  }

  return (data.indice_rotacion ?? 0) + 1;
}