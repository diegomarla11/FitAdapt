import { crearClienteSupabaseServer } from "@/lib/supabase/server";
import type { Ejercicio } from "@/tipos/ejercicio";

export async function obtenerEjercicioPorId(
  ejercicioId: string
): Promise<Ejercicio | null> {
  const supabase = await crearClienteSupabaseServer();

  const { data, error } = await supabase
    .from("ejercicios")
    .select("*")
    .eq("id", ejercicioId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as Ejercicio;
}