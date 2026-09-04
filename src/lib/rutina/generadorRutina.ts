import type { Perfil } from "@/tipos/perfil";
import type { Ejercicio } from "@/tipos/ejercicio";
import type {
    RutinaGenerada,
    DiaRutina,
    EjercicioRutina,
} from "@/tipos/rutina";
import { obtenerEjercicioPorRotacion } from "@/lib/rutina/seleccionEjercicios";
import { obtenerFiltrosAlternativos } from "@/lib/rutina/obtenerFiltrosAlternativos";
import { aplicarAdaptacionAvanzada } from "@/lib/dominio/rutina/aplicarAdaptacionAvanzada";
import { aplicarCorreccionSemanal } from "@/lib/dominio/rutina/aplicarCorreccionSemanal";

type FiltrosPlantilla = {
    grupoMuscular?: string;
    patronMovimiento?: string;
    dificultad?: string;
};

type PlantillaEjercicio = {
    filtros: FiltrosPlantilla;
    series: number;
    repeticiones: string;
    desplazamientoRotacion?: number;
};

type PlantillaDia = {
    titulo: string;
    ejercicios: PlantillaEjercicio[];
};

function convertirEjercicio(
    ejercicio: Ejercicio,
    series: number,
    repeticiones: string,
    filtros?: FiltrosPlantilla
): EjercicioRutina {
    const coincidencias: string[] = [];

    if (filtros?.grupoMuscular && ejercicio.grupo_muscular === filtros.grupoMuscular) {
        coincidencias.push("grupo muscular");
    }

    if (
        filtros?.patronMovimiento &&
        ejercicio.patron_movimiento === filtros.patronMovimiento
    ) {
        coincidencias.push("patrón de movimiento");
    }

    if (filtros?.dificultad && ejercicio.dificultad === filtros.dificultad) {
        coincidencias.push("nivel");
    }

    if (ejercicio.equipamiento) {
        coincidencias.push("equipamiento disponible");
    }

    return {
        id: ejercicio.id,
        nombre: ejercicio.nombre,
        grupo_muscular: ejercicio.grupo_muscular,
        patron_movimiento: ejercicio.patron_movimiento,
        dificultad: ejercicio.dificultad,
        series,
        repeticiones,
        explicacion_seleccion: {
            motivo:
                "Ejercicio seleccionado automáticamente por compatibilidad con el perfil y la estructura de la rutina.",
            coincidencias,
        },
    };
}

function crearEjercicioRutina(
    ejercicios: Ejercicio[],
    filtros: {
        grupoMuscular?: string;
        patronMovimiento?: string;
        dificultad?: string;
    },
    equipoDisponiblePerfil: string | null,
    molestiasPerfil: string | null,
    indiceRotacion: number,
    series: number,
    repeticiones: string
): EjercicioRutina | null {
    let ejercicio = obtenerEjercicioPorRotacion(
        ejercicios,
        {
            ...filtros,
            equipoDisponiblePerfil,
            molestiasPerfil,
        },
        indiceRotacion
    );

    if (!ejercicio) {
        const filtrosAlternativos = obtenerFiltrosAlternativos(filtros);

        for (const filtrosAlternativosActuales of filtrosAlternativos) {
            ejercicio = obtenerEjercicioPorRotacion(
                ejercicios,
                {
                    ...filtrosAlternativosActuales,
                    equipoDisponiblePerfil,
                    molestiasPerfil,
                },
                indiceRotacion
            );

            if (ejercicio) {
                break;
            }
        }
    }

    if (!ejercicio) {
        return null;
    }

    return convertirEjercicio(ejercicio, series, repeticiones, filtros);
}

async function construirDia(
    plantilla: PlantillaDia,
    numeroDia: number,
    ejercicios: Ejercicio[],
    perfil: Perfil,
    indiceRotacionBase: number
): Promise<DiaRutina> {
    const ejerciciosDia = plantilla.ejercicios
        .map((ejercicioPlantilla) => {
            const ejercicioAdaptado = ajustarPlantillaEjercicioPorPerfil(
                ejercicioPlantilla,
                perfil
            );

            return crearEjercicioRutina(
                ejercicios,
                ejercicioAdaptado.filtros,
                perfil.equipo_disponible,
                perfil.molestias,
                indiceRotacionBase + (ejercicioAdaptado.desplazamientoRotacion ?? 0),
                ejercicioAdaptado.series,
                ejercicioAdaptado.repeticiones
            );
        })
        .filter(Boolean) as EjercicioRutina[];

    const ejerciciosFinales = await aplicarAdaptacionAvanzada(
        ejerciciosDia,
        ejercicios,
        perfil
    );

    const ejerciciosAjustadosPorDuracion = ajustarDuracionSesion(
        ejerciciosFinales,
        perfil.duracion_sesion
    );

    return {
        dia: numeroDia,
        titulo: `Día ${numeroDia} - ${plantilla.titulo}`,
        ejercicios: ejerciciosAjustadosPorDuracion,
    };
}

function obtenerPlantillasPorDias(diasPorSemana: number): PlantillaDia[] {
    const fullBodyA: PlantillaDia = {
        titulo: "Full body A",
        ejercicios: [
            {
                filtros: {
                    grupoMuscular: "pierna",
                    patronMovimiento: "dominante de rodilla",
                },
                series: 4,
                repeticiones: "6-8",
                desplazamientoRotacion: 0,
            },
            {
                filtros: {
                    grupoMuscular: "pecho",
                    patronMovimiento: "empuje horizontal",
                },
                series: 4,
                repeticiones: "6-8",
                desplazamientoRotacion: 0,
            },
            {
                filtros: {
                    grupoMuscular: "espalda",
                    patronMovimiento: "tiron horizontal",
                },
                series: 4,
                repeticiones: "8-10",
                desplazamientoRotacion: 0,
            },
            {
                filtros: {
                    grupoMuscular: "biceps",
                    patronMovimiento: "aislamiento",
                },
                series: 3,
                repeticiones: "10-12",
                desplazamientoRotacion: 0,
            },
        ],
    };

    const fullBodyB: PlantillaDia = {
        titulo: "Full body B",
        ejercicios: [
            {
                filtros: {
                    grupoMuscular: "pierna",
                    patronMovimiento: "dominante de cadera",
                },
                series: 4,
                repeticiones: "8-10",
                desplazamientoRotacion: 0,
            },
            {
                filtros: {
                    grupoMuscular: "hombro",
                    patronMovimiento: "empuje vertical",
                },
                series: 4,
                repeticiones: "8-10",
                desplazamientoRotacion: 0,
            },
            {
                filtros: {
                    grupoMuscular: "espalda",
                    patronMovimiento: "tiron vertical",
                },
                series: 4,
                repeticiones: "6-10",
                desplazamientoRotacion: 0,
            },
            {
                filtros: {
                    grupoMuscular: "triceps",
                    patronMovimiento: "aislamiento",
                },
                series: 3,
                repeticiones: "10-12",
                desplazamientoRotacion: 0,
            },
        ],
    };

    const fullBodyC: PlantillaDia = {
        titulo: "Full body C",
        ejercicios: [
            {
                filtros: {
                    grupoMuscular: "pierna",
                    patronMovimiento: "dominante de rodilla",
                },
                series: 3,
                repeticiones: "8-10",
                desplazamientoRotacion: 1,
            },
            {
                filtros: {
                    grupoMuscular: "pecho",
                    patronMovimiento: "empuje horizontal",
                },
                series: 4,
                repeticiones: "8-10",
                desplazamientoRotacion: 1,
            },
            {
                filtros: {
                    grupoMuscular: "espalda",
                    patronMovimiento: "tiron horizontal",
                },
                series: 4,
                repeticiones: "8-10",
                desplazamientoRotacion: 1,
            },
            {
                filtros: {
                    grupoMuscular: "hombro",
                    patronMovimiento: "aislamiento",
                },
                series: 3,
                repeticiones: "12-15",
                desplazamientoRotacion: 0,
            },
        ],
    };

    const torsoA: PlantillaDia = {
        titulo: "Torso A",
        ejercicios: [
            {
                filtros: {
                    grupoMuscular: "pecho",
                    patronMovimiento: "empuje horizontal",
                },
                series: 4,
                repeticiones: "6-8",
                desplazamientoRotacion: 0,
            },
            {
                filtros: {
                    grupoMuscular: "espalda",
                    patronMovimiento: "tiron vertical",
                },
                series: 4,
                repeticiones: "6-10",
                desplazamientoRotacion: 0,
            },
            {
                filtros: {
                    grupoMuscular: "hombro",
                    patronMovimiento: "empuje vertical",
                },
                series: 3,
                repeticiones: "8-10",
                desplazamientoRotacion: 0,
            },
            {
                filtros: {
                    grupoMuscular: "biceps",
                    patronMovimiento: "aislamiento",
                },
                series: 3,
                repeticiones: "10-12",
                desplazamientoRotacion: 0,
            },
            {
                filtros: {
                    grupoMuscular: "triceps",
                    patronMovimiento: "aislamiento",
                },
                series: 3,
                repeticiones: "10-12",
                desplazamientoRotacion: 0,
            },
        ],
    };

    const piernaA: PlantillaDia = {
        titulo: "Pierna A",
        ejercicios: [
            {
                filtros: {
                    grupoMuscular: "pierna",
                    patronMovimiento: "dominante de rodilla",
                },
                series: 4,
                repeticiones: "6-8",
                desplazamientoRotacion: 0,
            },
            {
                filtros: {
                    grupoMuscular: "pierna",
                    patronMovimiento: "dominante de cadera",
                },
                series: 4,
                repeticiones: "8-10",
                desplazamientoRotacion: 0,
            },
            {
                filtros: {
                    grupoMuscular: "hombro",
                    patronMovimiento: "aislamiento",
                },
                series: 3,
                repeticiones: "12-15",
                desplazamientoRotacion: 0,
            },
        ],
    };

    const torsoB: PlantillaDia = {
        titulo: "Torso B",
        ejercicios: [
            {
                filtros: {
                    grupoMuscular: "pecho",
                    patronMovimiento: "empuje horizontal",
                },
                series: 4,
                repeticiones: "8-10",
                desplazamientoRotacion: 1,
            },
            {
                filtros: {
                    grupoMuscular: "espalda",
                    patronMovimiento: "tiron horizontal",
                },
                series: 4,
                repeticiones: "8-10",
                desplazamientoRotacion: 1,
            },
            {
                filtros: {
                    grupoMuscular: "hombro",
                    patronMovimiento: "empuje vertical",
                },
                series: 3,
                repeticiones: "8-10",
                desplazamientoRotacion: 1,
            },
            {
                filtros: {
                    grupoMuscular: "triceps",
                    patronMovimiento: "aislamiento",
                },
                series: 3,
                repeticiones: "10-12",
                desplazamientoRotacion: 1,
            },
            {
                filtros: {
                    grupoMuscular: "biceps",
                    patronMovimiento: "aislamiento",
                },
                series: 3,
                repeticiones: "10-12",
                desplazamientoRotacion: 1,
            },
        ],
    };

    const piernaB: PlantillaDia = {
        titulo: "Pierna B",
        ejercicios: [
            {
                filtros: {
                    grupoMuscular: "pierna",
                    patronMovimiento: "dominante de rodilla",
                },
                series: 3,
                repeticiones: "8-10",
                desplazamientoRotacion: 1,
            },
            {
                filtros: {
                    grupoMuscular: "pierna",
                    patronMovimiento: "dominante de cadera",
                },
                series: 3,
                repeticiones: "8-10",
                desplazamientoRotacion: 1,
            },
            {
                filtros: {
                    grupoMuscular: "hombro",
                    patronMovimiento: "aislamiento",
                },
                series: 3,
                repeticiones: "12-15",
                desplazamientoRotacion: 1,
            },
        ],
    };

    const torsoC: PlantillaDia = {
        titulo: "Torso C",
        ejercicios: [
            {
                filtros: {
                    grupoMuscular: "pecho",
                    patronMovimiento: "empuje horizontal",
                },
                series: 3,
                repeticiones: "10-12",
                desplazamientoRotacion: 2,
            },
            {
                filtros: {
                    grupoMuscular: "espalda",
                    patronMovimiento: "tiron vertical",
                },
                series: 3,
                repeticiones: "10-12",
                desplazamientoRotacion: 2,
            },
            {
                filtros: {
                    grupoMuscular: "espalda",
                    patronMovimiento: "tiron horizontal",
                },
                series: 3,
                repeticiones: "10-12",
                desplazamientoRotacion: 2,
            },
            {
                filtros: {
                    grupoMuscular: "biceps",
                    patronMovimiento: "aislamiento",
                },
                series: 3,
                repeticiones: "12-15",
                desplazamientoRotacion: 2,
            },
            {
                filtros: {
                    grupoMuscular: "triceps",
                    patronMovimiento: "aislamiento",
                },
                series: 3,
                repeticiones: "12-15",
                desplazamientoRotacion: 2,
            },
        ],
    };

    const piernaC: PlantillaDia = {
        titulo: "Pierna C",
        ejercicios: [
            {
                filtros: {
                    grupoMuscular: "pierna",
                    patronMovimiento: "dominante de rodilla",
                },
                series: 3,
                repeticiones: "10-12",
                desplazamientoRotacion: 2,
            },
            {
                filtros: {
                    grupoMuscular: "pierna",
                    patronMovimiento: "dominante de cadera",
                },
                series: 3,
                repeticiones: "10-12",
                desplazamientoRotacion: 2,
            },
            {
                filtros: {
                    grupoMuscular: "hombro",
                    patronMovimiento: "empuje vertical",
                },
                series: 3,
                repeticiones: "10-12",
                desplazamientoRotacion: 2,
            },
        ],
    };

    switch (diasPorSemana) {
        case 1:
            return [fullBodyA];
        case 2:
            return [fullBodyA, fullBodyB];
        case 3:
            return [fullBodyA, fullBodyB, fullBodyC];
        case 4:
            return [torsoA, piernaA, torsoB, piernaB];
        case 5:
            return [torsoA, piernaA, torsoB, piernaB, fullBodyC];
        case 6:
            return [torsoA, piernaA, torsoB, piernaB, torsoC, piernaC];
        case 7:
            return [torsoA, piernaA, torsoB, piernaB, torsoC, piernaC, fullBodyA];
        default:
            return [fullBodyA, fullBodyB, fullBodyC];
    }
}

function normalizarTexto(valor: string | null | undefined) {
    return valor?.trim().toLowerCase() ?? "";
}

function limitarNumero(valor: number, minimo: number, maximo: number) {
    if (valor < minimo) return minimo;
    if (valor > maximo) return maximo;
    return valor;
}

function obtenerDificultadPorNivel(nivel: string) {
    const nivelNormalizado = normalizarTexto(nivel);

    if (nivelNormalizado === "principiante") {
        return "principiante";
    }

    if (nivelNormalizado === "avanzado") {
        return "avanzado";
    }

    return "intermedio";
}

function esEjercicioAislamiento(patronMovimiento?: string | null) {
    return patronMovimiento === "aislamiento";
}

function ajustarSeriesPorPerfil(
    seriesBase: number,
    perfil: Perfil,
    patronMovimiento?: string | null
) {
    const objetivo = normalizarTexto(perfil.objetivo);
    const nivel = normalizarTexto(perfil.nivel);
    const aislamiento = esEjercicioAislamiento(patronMovimiento);

    let series = seriesBase;

    if (objetivo === "mantenimiento") {
        series -= 1;
    }

    if (objetivo === "fuerza" && aislamiento) {
        series -= 1;
    }

    if (objetivo === "hipertrofia" && aislamiento) {
        series += 0;
    }

    if (objetivo === "recomposicion" || objetivo === "recomposición") {
        series -= aislamiento ? 0 : 1;
    }

    if (nivel === "principiante") {
        series -= 1;
    }

    if (nivel === "avanzado" && !aislamiento) {
        series += 1;
    }

    return limitarNumero(series, 2, 5);
}

function ajustarRepeticionesPorPerfil(
    repeticionesBase: string,
    perfil: Perfil,
    patronMovimiento?: string | null
) {
    const objetivo = normalizarTexto(perfil.objetivo);
    const aislamiento = esEjercicioAislamiento(patronMovimiento);

    if (objetivo === "fuerza") {
        return aislamiento ? "8-10" : "4-6";
    }

    if (objetivo === "hipertrofia") {
        return aislamiento ? "10-15" : "8-12";
    }

    if (objetivo === "mantenimiento") {
        return aislamiento ? "10-12" : "8-10";
    }

    if (objetivo === "recomposicion" || objetivo === "recomposición") {
        return aislamiento ? "12-15" : "8-12";
    }

    return repeticionesBase;
}

function ajustarPlantillaEjercicioPorPerfil(
    ejercicioPlantilla: PlantillaEjercicio,
    perfil: Perfil
): PlantillaEjercicio {
    const dificultad = obtenerDificultadPorNivel(perfil.nivel);
    const patronMovimiento = ejercicioPlantilla.filtros.patronMovimiento;

    return {
        ...ejercicioPlantilla,
        filtros: {
            ...ejercicioPlantilla.filtros,
            dificultad,
        },
        series: ajustarSeriesPorPerfil(
            ejercicioPlantilla.series,
            perfil,
            patronMovimiento
        ),
        repeticiones: ajustarRepeticionesPorPerfil(
            ejercicioPlantilla.repeticiones,
            perfil,
            patronMovimiento
        ),
    };
}

function obtenerNumeroMedioRepeticiones(repeticiones: string) {
    const numeros = repeticiones
        .split("-")
        .map((valor) => Number(valor.trim()))
        .filter((valor) => Number.isFinite(valor));

    if (numeros.length === 0) {
        return 10;
    }

    const total = numeros.reduce((suma, valor) => suma + valor, 0);
    return total / numeros.length;
}

function estimarMinutosEjercicio(ejercicio: EjercicioRutina) {
    const repeticionesMedias = obtenerNumeroMedioRepeticiones(ejercicio.repeticiones);

    const segundosEjecucionPorSerie = repeticionesMedias * 4;

    const descanso =
        repeticionesMedias <= 6
            ? 150
            : ejercicio.patron_movimiento === "aislamiento"
                ? 60
                : 90;

    const segundosTotales =
        ejercicio.series * segundosEjecucionPorSerie +
        Math.max(0, ejercicio.series - 1) * descanso;

    return segundosTotales / 60;
}

function estimarMinutosDia(ejercicios: EjercicioRutina[]) {
    return ejercicios.reduce(
        (total, ejercicio) => total + estimarMinutosEjercicio(ejercicio),
        0
    );
}

function ajustarDuracionSesion(
    ejercicios: EjercicioRutina[],
    duracionSesion: number
) {
    const duracionObjetivo = limitarNumero(duracionSesion || 60, 15, 180);

    let resultado = [...ejercicios];

    while (
        resultado.length > 3 &&
        estimarMinutosDia(resultado) > duracionObjetivo
    ) {
        const indiceAislamiento = [...resultado]
            .map((ejercicio, indice) => ({ ejercicio, indice }))
            .reverse()
            .find((item) => item.ejercicio.patron_movimiento === "aislamiento")
            ?.indice;

        if (indiceAislamiento !== undefined) {
            resultado = resultado.filter((_, indice) => indice !== indiceAislamiento);
            continue;
        }

        const ultimoIndice = resultado.length - 1;
        resultado = resultado.map((ejercicio, indice) => {
            if (indice !== ultimoIndice) {
                return ejercicio;
            }

            return {
                ...ejercicio,
                series: limitarNumero(ejercicio.series - 1, 2, 5),
            };
        });

        if (estimarMinutosDia(resultado) > duracionObjetivo) {
            resultado = resultado.slice(0, -1);
        }
    }

    return resultado;
}

export async function generarRutinaBasica(
    perfil: Perfil,
    ejercicios: Ejercicio[],
    indiceRotacion: number
): Promise<RutinaGenerada> {
    const diasPorSemana = Math.max(1, Math.min(perfil.dias_por_semana, 7));
    const plantillas = obtenerPlantillasPorDias(diasPorSemana);

    const diasGenerados: DiaRutina[] = await Promise.all(
        plantillas.map((plantilla, indice) =>
            construirDia(plantilla, indice + 1, ejercicios, perfil, indiceRotacion)
        )
    );

    const diasCorregidos = aplicarCorreccionSemanal(
        diasGenerados,
        ejercicios,
        perfil
    );

    return {
        objetivo: perfil.objetivo,
        nivel: perfil.nivel,
        dias_por_semana: diasPorSemana,
        indice_rotacion: indiceRotacion,
        dias: diasCorregidos,
    };
}