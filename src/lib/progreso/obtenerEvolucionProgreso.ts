import { crearClienteSupabaseServer } from "@/lib/supabase/server";

export type PuntoEvolucionProgreso = {
    fecha: string;
    sesiones: number;
    ejercicios: number;
    seriesReales: number;
    pesoRegistrado: number;
    dolorMedio: number | null;
    fatigaMedia: number | null;
    cumplimiento: number;
    faciles: number;
    bien: number;
    dificiles: number;
};

type SesionUsuario = {
    id: string;
    fecha: string;
};

type FilaEjercicioSesion = {
    sesion_id: string;
    series_planeadas: number;
    series_reales: number | null;
    peso_usado: number | null;
    sensacion: "facil" | "bien" | "dificil" | null;
    nivel_dolor: number | null;
    fatiga: number | null;
    completado: boolean;
};

export async function obtenerEvolucionProgreso(): Promise<
    PuntoEvolucionProgreso[]
> {
    const supabase = await crearClienteSupabaseServer();

    const {
        data: { user },
        error: errorUsuario,
    } = await supabase.auth.getUser();

    if (errorUsuario || !user) {
        return [];
    }

    const { data: sesionesData, error: errorSesiones } = await supabase
        .from("sesiones_entrenamiento")
        .select("id, fecha")
        .eq("user_id", user.id)
        .order("fecha", { ascending: false })
        .limit(60);

    if (errorSesiones || !sesionesData || sesionesData.length === 0) {
        return [];
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
      sesion_id,
      series_planeadas,
      series_reales,
      peso_usado,
      sensacion,
      nivel_dolor,
      fatiga,
      completado
    `)
        .in("sesion_id", sesionesIds);

    if (errorEjercicios || !ejerciciosData) {
        return [];
    }

    const filas = ejerciciosData as FilaEjercicioSesion[];

    const mapa = new Map<
        string,
        {
            fecha: string;
            sesionesIds: Set<string>;
            ejercicios: number;
            seriesReales: number;
            seriesPlaneadas: number;
            pesoRegistrado: number;
            dolorTotal: number;
            dolorRegistros: number;
            fatigaTotal: number;
            fatigaRegistros: number;
            completados: number;
            faciles: number;
            bien: number;
            dificiles: number;
        }
    >();

    for (const fila of filas) {
        const fecha = fechaPorSesion.get(fila.sesion_id);

        if (!fecha) {
            continue;
        }

        const actual =
            mapa.get(fecha) ??
            {
                fecha,
                sesionesIds: new Set<string>(),
                ejercicios: 0,
                seriesReales: 0,
                seriesPlaneadas: 0,
                pesoRegistrado: 0,
                dolorTotal: 0,
                dolorRegistros: 0,
                fatigaTotal: 0,
                fatigaRegistros: 0,
                completados: 0,
                faciles: 0,
                bien: 0,
                dificiles: 0,
            };

        actual.sesionesIds.add(fila.sesion_id);
        actual.ejercicios += 1;
        actual.seriesReales += fila.series_reales ?? 0;
        actual.seriesPlaneadas += fila.series_planeadas ?? 0;
        actual.pesoRegistrado += fila.peso_usado ?? 0;
        actual.completados += fila.completado ? 1 : 0;

        if (fila.nivel_dolor !== null) {
            actual.dolorTotal += fila.nivel_dolor;
            actual.dolorRegistros += 1;
        }

        if (fila.fatiga !== null) {
            actual.fatigaTotal += fila.fatiga;
            actual.fatigaRegistros += 1;
        }

        if (fila.sensacion === "facil") actual.faciles += 1;
        if (fila.sensacion === "bien") actual.bien += 1;
        if (fila.sensacion === "dificil") actual.dificiles += 1;

        mapa.set(fecha, actual);
    }

    return Array.from(mapa.values())
        .map((item) => ({
            fecha: item.fecha,
            sesiones: item.sesionesIds.size,
            ejercicios: item.ejercicios,
            seriesReales: item.seriesReales,
            pesoRegistrado: item.pesoRegistrado,
            dolorMedio:
                item.dolorRegistros > 0 ? item.dolorTotal / item.dolorRegistros : null,
            fatigaMedia:
                item.fatigaRegistros > 0 ? item.fatigaTotal / item.fatigaRegistros : null,
            cumplimiento:
                item.seriesPlaneadas > 0 ? item.seriesReales / item.seriesPlaneadas : 0,
            faciles: item.faciles,
            bien: item.bien,
            dificiles: item.dificiles,
        }))
        .sort((a, b) => a.fecha.localeCompare(b.fecha));
}