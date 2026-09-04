import { crearClienteSupabaseServer } from "@/lib/supabase/server";

export async function verificarPropiedadRutina(
  rutinaId: string,
  userId: string
): Promise<boolean> {
  const supabase = await crearClienteSupabaseServer();

  const { data, error } = await supabase
    .from("rutinas")
    .select("id")
    .eq("id", rutinaId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) {
    return false;
  }

  return true;
}