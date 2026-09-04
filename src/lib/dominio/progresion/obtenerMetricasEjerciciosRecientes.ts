import { crearClienteSupabaseServer } from "@/lib/supabase/server";
import type {
  MetricasEjercicioReciente,
  RegistroEjercicioReciente,
  SensacionEjercicio,
} from "@/lib/dominio/progresion/tipos";

type SesionUsuario = {
  id: string;
  fecha: string;
};

type FilaSesionEjercicio = {
  ejercicio_id: string | null;
  nombre_ejercicio: string;
  grupo_muscular: string;
  sesion_id: string;
  series_planeadas: number;
  repeticiones_planeadas: string;
  series_reales: number | null;
  repeticiones_reales: string | null;
  peso_usado: number | null;
  sensacion: SensacionEjercicio | null;
  nivel_dolor: number | null;
  fatiga: number | null;
  descanso_recomendado: number | null;
  descanso_real: number | null;
  completado: boolean;
};

function obtenerModaSensaciones(
  faciles: number,
  bien: number,
  dificiles: number
): SensacionEjercicio | null {
  if (faciles === 0 && bien === 0 && dificiles === 0) {
    return null;
  }

  if (faciles >= bien && faciles >= dificiles) {
    return "facil";
  }

  if (dificiles >= faciles && dificiles >= bien) {
    return "dificil";
  }

  return "bien";
}

function actualizarMedia(
  mediaActual: number | null,
  nuevoValor: number | null,
  totalValoresAnteriores: number
) {
  if (nuevoValor === null) {
    return mediaActual;
  }

  if (mediaActual === null) {
    return nuevoValor;
  }

  return (mediaActual * totalValoresAnteriores + nuevoValor) / (totalValoresAnteriores + 1);
}

function calcularRatioDescanso(
  descansoRealMedio: number | null,
  descansoRecomendadoMedio: number | null
) {
  if (
    descansoRealMedio === null ||
    descansoRecomendadoMedio === null ||
    descansoRecomendadoMedio <= 0
  ) {
    return null;
  }

  return descansoRealMedio / descansoRecomendadoMedio;
}

export async function obtenerMetricasEjerciciosRecientes(
  limiteSesiones = 50
): Promise<Map<string, MetricasEjercicioReciente>> {
  const supabase = await crearClienteSupabaseServer();

  const {
    data: { user },
    error: errorUsuario,
  } = await supabase.auth.getUser();

  if (errorUsuario || !user) {
    return new Map();
  }

  const { data: sesionesData, error: errorSesiones } = await supabase
    .from("sesiones_entrenamiento")
    .select("id, fecha")
    .eq("user_id", user.id)
    .order("fecha", { ascending: false })
    .limit(limiteSesiones);

  if (errorSesiones || !sesionesData || sesionesData.length === 0) {
    return new Map();
  }

  const sesiones = sesionesData as SesionUsuario[];
  const sesionesIds = sesiones.map((sesion) => sesion.id);

  const fechaPorSesion = new Map<string, string>();
  for (const sesion of sesiones) {
    fechaPorSesion.set(sesion.id, sesion.fecha);
  }

  const { data: ejerciciosData, error: errorEjercicios } = await supabase
    .from("sesion_ejercicios")
    .select(`
  ejercicio_id,
  nombre_ejercicio,
  grupo_muscular,
  sesion_id,
  series_planeadas,
  repeticiones_planeadas,
  series_reales,
  repeticiones_reales,
  peso_usado,
  sensacion,
  nivel_dolor,
  fatiga,
  descanso_recomendado,
  descanso_real,
  completado
`)
    .in("sesion_id", sesionesIds)
    .not("ejercicio_id", "is", null)
    .order("created_at", { ascending: false });

  if (errorEjercicios || !ejerciciosData) {
    return new Map();
  }

  const filas = ejerciciosData as FilaSesionEjercicio[];

  const registros: RegistroEjercicioReciente[] = filas.map((fila) => ({
    ejercicioId: fila.ejercicio_id as string,
    nombreEjercicio: fila.nombre_ejercicio,
    grupoMuscular: fila.grupo_muscular,
    sesionId: fila.sesion_id,
    fecha: fechaPorSesion.get(fila.sesion_id) ?? "",
    seriesPlaneadas: fila.series_planeadas,
    repeticionesPlaneadas: fila.repeticiones_planeadas,
    seriesReales: fila.series_reales,
    repeticionesReales: fila.repeticiones_reales,
    pesoUsado: fila.peso_usado,
    sensacion: fila.sensacion,
    nivelDolor: fila.nivel_dolor,
    fatiga: fila.fatiga,
    descansoRecomendado: fila.descanso_recomendado,
    descansoReal: fila.descanso_real,
    completado: fila.completado,
  }));

  const mapa = new Map<string, MetricasEjercicioReciente>();

  for (const registro of registros) {
    const actual = mapa.get(registro.ejercicioId);

    if (!actual) {
      mapa.set(registro.ejercicioId, {
        ejercicioId: registro.ejercicioId,
        nombreEjercicio: registro.nombreEjercicio,
        grupoMuscular: registro.grupoMuscular,
        apariciones: 1,
        completados: registro.completado ? 1 : 0,
        cumplimiento: registro.completado ? 1 : 0,
        seriesPlaneadasTotales: registro.seriesPlaneadas,
        seriesRealesTotales: registro.seriesReales ?? 0,
        ratioSeries:
          registro.seriesPlaneadas > 0
            ? (registro.seriesReales ?? 0) / registro.seriesPlaneadas
            : 0,
        pesoMedio: registro.pesoUsado ?? null,
        sensacionDominante: registro.sensacion,
        faciles: registro.sensacion === "facil" ? 1 : 0,
        bien: registro.sensacion === "bien" ? 1 : 0,
        dificiles: registro.sensacion === "dificil" ? 1 : 0,
        dolorMedio: registro.nivelDolor,
        dolorMaximo: registro.nivelDolor ?? 0,
        fatigaMedia: registro.fatiga,
        descansoRecomendadoMedio: registro.descansoRecomendado,
        descansoRealMedio: registro.descansoReal,
        ratioDescanso: calcularRatioDescanso(
          registro.descansoReal,
          registro.descansoRecomendado
        ),
        ultimoRegistro: registro,
      });

      continue;
    }

    actual.apariciones += 1;
    actual.completados += registro.completado ? 1 : 0;
    actual.seriesPlaneadasTotales += registro.seriesPlaneadas;
    actual.seriesRealesTotales += registro.seriesReales ?? 0;

    if (registro.sensacion === "facil") actual.faciles += 1;
    if (registro.sensacion === "bien") actual.bien += 1;
    if (registro.sensacion === "dificil") actual.dificiles += 1;

    const valoresAnteriores = actual.apariciones - 1;

    actual.pesoMedio = actualizarMedia(
      actual.pesoMedio,
      registro.pesoUsado,
      valoresAnteriores
    );

    actual.dolorMedio = actualizarMedia(
      actual.dolorMedio,
      registro.nivelDolor,
      valoresAnteriores
    );
    actual.dolorMaximo = Math.max(
      actual.dolorMaximo,
      registro.nivelDolor ?? 0
    );

    actual.fatigaMedia = actualizarMedia(
      actual.fatigaMedia,
      registro.fatiga,
      valoresAnteriores
    );

    actual.descansoRecomendadoMedio = actualizarMedia(
      actual.descansoRecomendadoMedio,
      registro.descansoRecomendado,
      valoresAnteriores
    );

    actual.descansoRealMedio = actualizarMedia(
      actual.descansoRealMedio,
      registro.descansoReal,
      valoresAnteriores
    );

    actual.ratioDescanso = calcularRatioDescanso(
      actual.descansoRealMedio,
      actual.descansoRecomendadoMedio
    );

    if (!actual.ultimoRegistro || registro.fecha >= actual.ultimoRegistro.fecha) {
      actual.ultimoRegistro = registro;
    }

    actual.cumplimiento =
      actual.apariciones > 0 ? actual.completados / actual.apariciones : 0;

    actual.ratioSeries =
      actual.seriesPlaneadasTotales > 0
        ? actual.seriesRealesTotales / actual.seriesPlaneadasTotales
        : 0;

    actual.sensacionDominante = obtenerModaSensaciones(
      actual.faciles,
      actual.bien,
      actual.dificiles
    );
  }

  return mapa;
}