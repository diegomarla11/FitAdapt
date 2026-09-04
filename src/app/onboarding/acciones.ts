"use server";

import { crearClienteSupabaseServer } from "@/lib/supabase/server";
import { validarDatosPerfil } from "@/lib/perfil/validarDatosPerfil";

type DatosOnboarding = {
  nombre: string;
  objetivo: string;
  nivel: string;
  dias_por_semana: number;
  duracion_sesion: number;
  equipo_disponible: string;
  molestias: string;
};

export async function guardarPerfilOnboarding(datos: DatosOnboarding) {
  const supabase = await crearClienteSupabaseServer();

  const {
    data: { user },
    error: errorUsuario,
  } = await supabase.auth.getUser();

  if (errorUsuario || !user) {
    return {
      ok: false,
      error: "Debes iniciar sesión para guardar el perfil.",
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

  const datosPerfil = {
    user_id: user.id,
    nombre: datos.nombre.trim(),
    objetivo: datos.objetivo,
    nivel: datos.nivel,
    dias_por_semana: datos.dias_por_semana,
    duracion_sesion: datos.duracion_sesion,
    equipo_disponible: datos.equipo_disponible,
    molestias: datos.molestias.trim() || "No indicadas",
    updated_at: new Date().toISOString(),
  };

  const { data: perfilExistente, error: errorBuscarPerfil } = await supabase
    .from("perfiles")
    .select("id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (errorBuscarPerfil) {
    return {
      ok: false,
      error: "Ha ocurrido un error al comprobar el perfil existente.",
    };
  }

  if (perfilExistente) {
    const { error: errorActualizar } = await supabase
      .from("perfiles")
      .update(datosPerfil)
      .eq("id", perfilExistente.id)
      .eq("user_id", user.id);

    if (errorActualizar) {
      return {
        ok: false,
        error: "Ha ocurrido un error al actualizar el perfil.",
      };
    }

    return {
      ok: true,
    };
  }

  const { error: errorInsertar } = await supabase
    .from("perfiles")
    .insert([datosPerfil]);

  if (errorInsertar) {
    return {
      ok: false,
      error: "Ha ocurrido un error al guardar el perfil.",
    };
  }

  return {
    ok: true,
  };
}