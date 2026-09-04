import { crearClienteSupabaseServer } from "@/lib/supabase/server";
import type {
  RutinaGuardada,
  RutinaEjercicioGuardado,
} from "@/tipos/rutinaGuardada";
import type { Perfil } from "@/tipos/perfil";

export async function obtenerUltimoPerfil(): Promise<Perfil | null> {
  const supabase = await crearClienteSupabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from("perfiles")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return null;
  }

  return (data as Perfil | null) ?? null;
}

export async function obtenerUltimaRutinaGuardada(): Promise<{
  rutina: RutinaGuardada;
  ejercicios: RutinaEjercicioGuardado[];
} | null> {
  const supabase = await crearClienteSupabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: rutina, error: errorRutina } = await supabase
    .from("rutinas")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

if (errorRutina) {
  console.error("Error real obteniendo rutina:", errorRutina);
  return null;
}

if (!rutina) {
  return null;
}

  const { data: ejercicios, error: errorEjercicios } = await supabase
    .from("rutina_ejercicios")
    .select("*")
    .eq("rutina_id", rutina.id)
    .order("dia", { ascending: true })
    .order("created_at", { ascending: true });

  if (errorEjercicios) {
    console.error("Error obteniendo ejercicios de rutina:", errorEjercicios);
    return null;
  }

  return {
    rutina: rutina as RutinaGuardada,
    ejercicios: (ejercicios ?? []) as RutinaEjercicioGuardado[],
  };
}