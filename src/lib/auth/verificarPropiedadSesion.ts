import { crearClienteSupabaseServer } from "@/lib/supabase/server";

export async function verificarPropiedadSesion(
  sesionId: string,
  userId: string
): Promise<boolean> {
  const supabase = await crearClienteSupabaseServer();

  const { data, error } = await supabase
    .from("sesiones_entrenamiento")
    .select("id")
    .eq("id", sesionId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) {
    return false;
  }

  return true;
}