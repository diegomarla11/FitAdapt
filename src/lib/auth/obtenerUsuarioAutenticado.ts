import { crearClienteSupabaseServer } from "@/lib/supabase/server";

export async function obtenerUsuarioAutenticado() {
  const supabase = await crearClienteSupabaseServer();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}