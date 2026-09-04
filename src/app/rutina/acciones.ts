"use server";

import { crearClienteSupabaseServer } from "@/lib/supabase/server";
import type { RutinaGenerada } from "@/tipos/rutina";
import { verificarPropiedadRutina } from "@/lib/auth/verificarPropiedadRutina";
import { revalidatePath } from "next/cache";

type ResultadoGuardadoRutina = {
  ok: boolean;
  rutinaId?: string;
  error?: string;
};

export async function guardarRutinaEditada(
  rutina: RutinaGenerada,
  rutinaIdExistente?: string | null
): Promise<ResultadoGuardadoRutina> {
  try {
    const supabase = await crearClienteSupabaseServer();

    const {
      data: { user },
      error: errorUsuario,
    } = await supabase.auth.getUser();

    if (errorUsuario || !user) {
      return {
        ok: false,
        error: "Debes iniciar sesión para guardar la rutina.",
      };
    }

    if (!rutina.objetivo?.trim()) {
      return {
        ok: false,
        error: "La rutina no tiene objetivo válido.",
      };
    }

    if (!rutina.nivel?.trim()) {
      return {
        ok: false,
        error: "La rutina no tiene nivel válido.",
      };
    }

    if (
      !Number.isInteger(rutina.dias_por_semana) ||
      rutina.dias_por_semana < 1 ||
      rutina.dias_por_semana > 7
    ) {
      return {
        ok: false,
        error: "Los días por semana de la rutina no son válidos.",
      };
    }

    if (!Array.isArray(rutina.dias) || rutina.dias.length === 0) {
      return {
        ok: false,
        error: "La rutina no contiene días de entrenamiento.",
      };
    }

    if (rutina.dias.length > 7) {
      return {
        ok: false,
        error: "La rutina contiene demasiados días de entrenamiento.",
      };
    }

    for (const dia of rutina.dias) {
      if (!Number.isInteger(dia.dia) || dia.dia < 1 || dia.dia > 7) {
        return {
          ok: false,
          error: "Hay un día de rutina no válido.",
        };
      }

      if (!dia.titulo?.trim()) {
        return {
          ok: false,
          error: "Hay un día de rutina sin título válido.",
        };
      }

      if (!Array.isArray(dia.ejercicios) || dia.ejercicios.length === 0) {
        return {
          ok: false,
          error: `El ${dia.titulo} no contiene ejercicios.`,
        };
      }

      if (dia.ejercicios.length > 20) {
        return {
          ok: false,
          error: `El ${dia.titulo} contiene demasiados ejercicios.`,
        };
      }

      for (const ejercicio of dia.ejercicios) {
        if (!ejercicio.id?.trim()) {
          return {
            ok: false,
            error: `Hay un ejercicio sin identificador válido en ${dia.titulo}.`,
          };
        }

        if (!ejercicio.nombre?.trim()) {
          return {
            ok: false,
            error: `Hay un ejercicio sin nombre válido en ${dia.titulo}.`,
          };
        }

        if (!ejercicio.grupo_muscular?.trim()) {
          return {
            ok: false,
            error: `El ejercicio "${ejercicio.nombre}" no tiene grupo muscular válido.`,
          };
        }

        if (!Number.isFinite(ejercicio.series) || ejercicio.series < 1 || ejercicio.series > 10) {
          return {
            ok: false,
            error: `Las series de "${ejercicio.nombre}" no son válidas.`,
          };
        }

        if (!ejercicio.repeticiones?.trim()) {
          return {
            ok: false,
            error: `Las repeticiones de "${ejercicio.nombre}" no son válidas.`,
          };
        }
      }
    }

    let rutinaId = rutinaIdExistente ?? null;

    if (rutinaId) {
      const esPropietario = await verificarPropiedadRutina(rutinaId, user.id);

      if (!esPropietario) {
        return {
          ok: false,
          error: "No tienes permiso para modificar esta rutina.",
        };
      }
      const { error: errorActualizarRutina } = await supabase

        .from("rutinas")
        .update({
          objetivo: rutina.objetivo,
          nivel: rutina.nivel,
          dias_por_semana: rutina.dias_por_semana,
        })
        .eq("id", rutinaId)
        .eq("user_id", user.id);

      if (errorActualizarRutina) {
        return { ok: false, error: "No se ha podido actualizar la rutina." };
      }

      const { error: errorBorrarEjercicios } = await supabase
        .from("rutina_ejercicios")
        .delete()
        .eq("rutina_id", rutinaId);

      if (errorBorrarEjercicios) {
        return {
          ok: false,
          error: "No se han podido reemplazar los ejercicios de la rutina.",
        };
      }
    } else {
      const { data: rutinaCreada, error: errorCrearRutina } = await supabase
        .from("rutinas")
        .insert({
          user_id: user.id,
          objetivo: rutina.objetivo,
          nivel: rutina.nivel,
          dias_por_semana: rutina.dias_por_semana,
          indice_rotacion: rutina.indice_rotacion ?? 0,
        })
        .select()
        .single();

      if (errorCrearRutina || !rutinaCreada) {
        return { ok: false, error: "No se ha podido crear la rutina." };
      }

      rutinaId = rutinaCreada.id;
    }

    const ejerciciosParaInsertar = rutina.dias.flatMap((dia) =>
      dia.ejercicios
        .filter((ejercicio) => ejercicio.id && ejercicio.id.trim() !== "")
        .map((ejercicio) => ({
          rutina_id: rutinaId,
          ejercicio_id: ejercicio.id,
          dia: dia.dia,
          titulo_dia: dia.titulo,
          nombre_ejercicio: ejercicio.nombre,
          grupo_muscular: ejercicio.grupo_muscular,
          series: ejercicio.series,
          repeticiones: ejercicio.repeticiones,
        }))
    );

    const totalEjerciciosRutina = rutina.dias.reduce(
      (total, dia) => total + dia.ejercicios.length,
      0
    );

    if (ejerciciosParaInsertar.length !== totalEjerciciosRutina) {
      return {
        ok: false,
        error:
          "No se ha podido guardar la rutina porque hay ejercicios sin id válido. Guarda primero una sustitución o revisa la rutina.",
      };
    }

    const { error: errorInsertarEjercicios } = await supabase
      .from("rutina_ejercicios")
      .insert(ejerciciosParaInsertar);

    if (errorInsertarEjercicios) {
      console.error("Error insertando ejercicios:", errorInsertarEjercicios);

      return {
        ok: false,
        error: errorInsertarEjercicios.message,
      };
    }

    revalidatePath("/rutina");
    revalidatePath("/entrenamiento");
    revalidatePath("/inicio");

    return {
      ok: true,
      rutinaId: rutinaId ?? undefined,
    };
  } catch {
    return {
      ok: false,
      error: "Ha ocurrido un error inesperado al guardar la rutina.",
    };
  }
}