import { crearClienteSupabaseServer } from "@/lib/supabase/server";

export async function obtenerUsuarioActual() {
  const supabase = await crearClienteSupabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}