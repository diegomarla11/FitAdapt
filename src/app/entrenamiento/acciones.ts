"use server";

import { crearClienteSupabaseServer } from "@/lib/supabase/server";
import { verificarPropiedadSesion } from "@/lib/auth/verificarPropiedadSesion";
import { validarRepeticionesReales } from "@/lib/entrenamiento/validarRepeticionesReales";
import { calcularDescansoRecomendado } from "@/lib/entrenamiento/calcularDescansoRecomendado";

type EstadoResultado = "completado" | "parcial" | "superado";
type SensacionEjercicio = "facil" | "bien" | "dificil";

type EjercicioCompletado = {
  ejercicioId: string;
  nombre: string;
  grupo_muscular: string;
  series: number;
  repeticiones: string;
  estado: EstadoResultado;
  seriesReales: number;
  repeticionesReales: string;
  pesoUsado: number | null;
  sensacion: SensacionEjercicio;
  nivelDolor: number | null;
  fatiga: number | null;
  descansoRecomendado: number | null;
  descansoReal: number | null;
  motivoParcial: string | null;
};

type GuardarSesionInput = {
  rutinaId: string | null;
  dia: number;
  tituloDia: string;
  ejercicios: EjercicioCompletado[];
  sesionIdExistente?: string | null;
  notaSesion?: string | null;
};

type SesionGuardada = {
  id: string;
  rutina_id: string | null;
  user_id: string;
  dia: number;
  titulo_dia: string;
  fecha: string;
  nota_sesion: string | null;
  created_at: string;
};

type EjercicioSesionGuardado = {
  id: string;
  sesion_id: string;
  ejercicio_id: string | null;
  nombre_ejercicio: string;
  grupo_muscular: string;
  series_planeadas: number;
  repeticiones_planeadas: string;
  series_reales: number | null;
  repeticiones_reales: string | null;
  peso_usado: number | null;
  sensacion: SensacionEjercicio | null;
  estado_resultado: EstadoResultado | null;
  nivel_dolor: number | null;
  fatiga: number | null;
  descanso_recomendado: number | null;
  descanso_real: number | null;
  motivo_parcial: string | null;
  completado: boolean;
  created_at: string;
};

const ESTADOS_VALIDOS: EstadoResultado[] = [
  "completado",
  "parcial",
  "superado",
];

const SENSACIONES_VALIDAS: SensacionEjercicio[] = [
  "facil",
  "bien",
  "dificil",
];

function obtenerFechaHoyISO() {
  return new Date().toISOString().slice(0, 10);
}

function validarSesionEntrenamiento(datosSesion: GuardarSesionInput) {
  if (!Number.isInteger(datosSesion.dia) || datosSesion.dia < 1 || datosSesion.dia > 7) {
    return "El día de entrenamiento no es válido.";
  }

  if (!datosSesion.tituloDia?.trim()) {
    return "Falta el título del día de entrenamiento.";
  }

  if (!Array.isArray(datosSesion.ejercicios)) {
    return "Los ejercicios enviados no son válidos.";
  }

  if (datosSesion.ejercicios.length === 0) {
    return "Marca al menos un ejercicio como completado antes de guardar la sesión.";
  }

  if (datosSesion.ejercicios.length > 20) {
    return "La sesión contiene demasiados ejercicios.";
  }

  for (const ejercicio of datosSesion.ejercicios) {

    const descansoRecomendado =
      ejercicio.descansoRecomendado ??
      calcularDescansoRecomendado({
        grupoMuscular: ejercicio.grupo_muscular,
        series: ejercicio.series,
        repeticiones: ejercicio.repeticiones,
      });

    const descansoReal = ejercicio.descansoReal ?? descansoRecomendado;
    const nivelDolor = ejercicio.nivelDolor ?? 0;
    const fatiga = ejercicio.fatiga ?? 5;
    if (!ejercicio.ejercicioId?.trim()) {
      return "Hay un ejercicio sin identificador válido.";
    }

    if (!ejercicio.nombre?.trim()) {
      return "Hay un ejercicio sin nombre válido.";
    }

    if (!ejercicio.grupo_muscular?.trim()) {
      return `El ejercicio "${ejercicio.nombre}" no tiene grupo muscular válido.`;
    }

    if (!Number.isFinite(ejercicio.series) || ejercicio.series < 1 || ejercicio.series > 10) {
      return `Las series planificadas de "${ejercicio.nombre}" no son válidas.`;
    }

    if (!ejercicio.repeticiones?.trim()) {
      return `Las repeticiones planificadas de "${ejercicio.nombre}" no son válidas.`;
    }

    if (!Number.isFinite(ejercicio.seriesReales) || ejercicio.seriesReales < 1 || ejercicio.seriesReales > 20) {
      return `Las series reales de "${ejercicio.nombre}" deben estar entre 1 y 20.`;
    }

    const repeticionesParaValidar =
      ejercicio.repeticionesReales.trim() === ejercicio.repeticiones.trim()
        ? ""
        : ejercicio.repeticionesReales;

    if (
      !validarRepeticionesReales(
        ejercicio.seriesReales,
        repeticionesParaValidar
      )
    ) {
      return `Revisa las repeticiones reales de "${ejercicio.nombre}". Deben coincidir con el número de series reales.`;
    }

    if (
      ejercicio.pesoUsado !== null &&
      (!Number.isFinite(ejercicio.pesoUsado) || ejercicio.pesoUsado < 0 || ejercicio.pesoUsado > 1000)
    ) {
      return `El peso usado en "${ejercicio.nombre}" no es válido.`;
    }

    if (!Number.isFinite(nivelDolor) || nivelDolor < 0 || nivelDolor > 10) {
      return `El nivel de dolor de "${ejercicio.nombre}" debe estar entre 0 y 10.`;
    }

    if (!Number.isFinite(fatiga) || fatiga < 0 || fatiga > 10) {
      return `La fatiga de "${ejercicio.nombre}" debe estar entre 0 y 10.`;
    }

    if (
      !Number.isFinite(descansoRecomendado) ||
      descansoRecomendado < 0 ||
      descansoRecomendado > 3600
    ) {
      return `El descanso recomendado de "${ejercicio.nombre}" no es válido.`;
    }

    if (
      !Number.isFinite(descansoReal) ||
      descansoReal < 0 ||
      descansoReal > 3600
    ) {
      return `El descanso real de "${ejercicio.nombre}" no es válido.`;
    }

    if (
      ejercicio.motivoParcial !== null &&
      ejercicio.motivoParcial.length > 300
    ) {
      return `El motivo parcial de "${ejercicio.nombre}" es demasiado largo.`;
    }

    if (
      ejercicio.estado === "parcial" &&
      ejercicio.motivoParcial !== null &&
      ejercicio.motivoParcial.trim().length === 0
    ) {
      return `El motivo parcial de "${ejercicio.nombre}" no es válido.`;
    }

    if (!SENSACIONES_VALIDAS.includes(ejercicio.sensacion)) {
      return `La sensación indicada en "${ejercicio.nombre}" no es válida.`;
    }

    if (!ESTADOS_VALIDOS.includes(ejercicio.estado)) {
      return `El resultado indicado en "${ejercicio.nombre}" no es válido.`;
    }
  }

  return null;
}

export async function guardarSesionEntrenamientoAction(
  datosSesion: GuardarSesionInput
): Promise<{
  sesion: SesionGuardada;
  ejercicios: EjercicioSesionGuardado[];
}> {
  const supabase = await crearClienteSupabaseServer();

  const {
    data: { user },
    error: errorUsuario,
  } = await supabase.auth.getUser();

  if (errorUsuario || !user) {
    throw new Error("Debes iniciar sesión para guardar el entrenamiento.");
  }

  const errorValidacion = validarSesionEntrenamiento(datosSesion);

  if (errorValidacion) {
    throw new Error(errorValidacion);
  }

  let sesionId = datosSesion.sesionIdExistente ?? null;

  if (!sesionId) {
    const { data: nuevaSesion, error: errorInsertSesion } = await supabase
      .from("sesiones_entrenamiento")
      .insert({
        rutina_id: datosSesion.rutinaId,
        user_id: user.id,
        dia: datosSesion.dia,
        titulo_dia: datosSesion.tituloDia.trim(),
        fecha: obtenerFechaHoyISO(),
        nota_sesion: datosSesion.notaSesion?.trim() || null,
      })
      .select("*")
      .single();

    if (errorInsertSesion || !nuevaSesion) {
      throw new Error("No se pudo guardar la sesión de entrenamiento.");
    }

    sesionId = nuevaSesion.id;
  } else {
    const esPropietarioSesion = await verificarPropiedadSesion(sesionId, user.id);

    if (!esPropietarioSesion) {
      throw new Error("No tienes permiso para modificar esta sesión.");
    }

    const { error: errorUpdateSesion } = await supabase
      .from("sesiones_entrenamiento")
      .update({
        nota_sesion: datosSesion.notaSesion?.trim() || null,
        fecha: obtenerFechaHoyISO(),
      })
      .eq("id", sesionId)
      .eq("user_id", user.id);

    if (errorUpdateSesion) {
      throw new Error("No se pudo actualizar la sesión de entrenamiento.");
    }

    const { error: errorDeleteEjercicios } = await supabase
      .from("sesion_ejercicios")
      .delete()
      .eq("sesion_id", sesionId);

    if (errorDeleteEjercicios) {
      throw new Error("No se pudieron actualizar los ejercicios de la sesión.");
    }
  }

  const ejerciciosParaInsertar = datosSesion.ejercicios.map((ejercicio) => ({
    sesion_id: sesionId,
    ejercicio_id: ejercicio.ejercicioId,
    nombre_ejercicio: ejercicio.nombre.trim(),
    grupo_muscular: ejercicio.grupo_muscular.trim(),
    series_planeadas: ejercicio.series,
    repeticiones_planeadas: ejercicio.repeticiones.trim(),
    completado: true,
    series_reales: ejercicio.seriesReales,
    repeticiones_reales:
      ejercicio.repeticionesReales.trim() || ejercicio.repeticiones.trim(),
    peso_usado: ejercicio.pesoUsado,
    sensacion: ejercicio.sensacion,
    estado_resultado: ejercicio.estado,
    nivel_dolor: ejercicio.nivelDolor ?? 0,
    fatiga: ejercicio.fatiga ?? 5,
    descanso_recomendado:
      ejercicio.descansoRecomendado ??
      calcularDescansoRecomendado({
        grupoMuscular: ejercicio.grupo_muscular,
        series: ejercicio.series,
        repeticiones: ejercicio.repeticiones,
      }),
    descanso_real:
      ejercicio.descansoReal ??
      ejercicio.descansoRecomendado ??
      calcularDescansoRecomendado({
        grupoMuscular: ejercicio.grupo_muscular,
        series: ejercicio.series,
        repeticiones: ejercicio.repeticiones,
      }),
    motivo_parcial:
      ejercicio.estado === "parcial"
        ? ejercicio.motivoParcial?.trim() || null
        : null,
  }));

  const { data: ejerciciosGuardados, error: errorInsertEjercicios } =
    await supabase
      .from("sesion_ejercicios")
      .insert(ejerciciosParaInsertar)
      .select("*");

  if (errorInsertEjercicios || !ejerciciosGuardados) {
    throw new Error("No se pudieron guardar los ejercicios de la sesión.");
  }

  const { data: sesionFinal, error: errorSesionFinal } = await supabase
    .from("sesiones_entrenamiento")
    .select("*")
    .eq("id", sesionId)
    .eq("user_id", user.id)
    .single();

  if (errorSesionFinal || !sesionFinal) {
    throw new Error("No se pudo recuperar la sesión guardada.");
  }

  return {
    sesion: sesionFinal,
    ejercicios: ejerciciosGuardados,
  };
}