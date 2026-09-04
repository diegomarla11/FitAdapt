"use server";

import { crearClienteSupabaseServer } from "@/lib/supabase/server";
import { validarDatosPerfil } from "@/lib/perfil/validarDatosPerfil";

type DatosPerfil = {
  id: string;
  nombre: string;
  objetivo: string;
  nivel: string;
  dias_por_semana: number;
  duracion_sesion: number;
  equipo_disponible: string;
  molestias: string;
};

export async function actualizarPerfil(datos: DatosPerfil) {
  const supabase = await crearClienteSupabaseServer();

  const {
    data: { user },
    error: errorUsuario,
  } = await supabase.auth.getUser();

  if (errorUsuario || !user) {
    return {
      ok: false,
      error: "Debes iniciar sesión para actualizar el perfil.",
    };
  }

  if (!datos.id) {
    return {
      ok: false,
      error: "No se ha podido identificar el perfil a actualizar.",
    };
  }

  const errorValidacion = validarDatosPerfil({
    objetivo: datos.objetivo,
    nivel: datos.nivel,
    dias_por_semana: datos.dias_por_semana,
    duracion_sesion: datos.duracion_sesion,
    equipo_disponible: datos.equipo_disponible,
  });

  if (errorValidacion) {
    return {
      ok: false,
      error: errorValidacion,
    };
  }

  const { error } = await supabase
    .from("perfiles")
    .update({
      nombre: datos.nombre.trim(),
      objetivo: datos.objetivo,
      nivel: datos.nivel,
      dias_por_semana: datos.dias_por_semana,
      duracion_sesion: datos.duracion_sesion,
      equipo_disponible: datos.equipo_disponible,
      molestias: datos.molestias.trim() || "No indicadas",
      updated_at: new Date().toISOString(),
    })
    .eq("id", datos.id)
    .eq("user_id", user.id);

  if (error) {
    return {
      ok: false,
      error: "No se ha podido actualizar el perfil.",
    };
  }

  return {
    ok: true,
  };
}