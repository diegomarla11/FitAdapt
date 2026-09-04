import { redirect } from "next/navigation";
import { crearClienteSupabaseServer } from "@/lib/supabase/server";

export async function obtenerUsuarioActual() {
  const supabase = await crearClienteSupabaseServer();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  return user;
}