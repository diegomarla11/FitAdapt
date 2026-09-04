import type { Ejercicio } from "@/tipos/ejercicio";
import type { EjercicioRutina, RutinaGenerada } from "@/tipos/rutina";
import type { SolicitudRutinaInterpretada } from "@/lib/rutina/nlp/interpretarSolicitudRutina";
import { seleccionarEjerciciosFiltrados } from "@/lib/rutina/seleccionEjercicios";

type ResultadoAplicacionSolicitud = {
    rutina: RutinaGenerada;
    cambios: string[];
};

function normalizarTexto(valor: string | null | undefined) {
    return (
        valor
            ?.toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .trim() ?? ""
    );
}

function limitarSeries(series: number) {
    if (series < 1) return 1;
    if (series > 6) return 6;
    return series;
}

function esMismoEjercicio(ejercicio: EjercicioRutina, textoEjercicio: string) {
    const nombre = normalizarTexto(ejercicio.nombre);
    const texto = normalizarTexto(textoEjercicio);

    return nombre.includes(texto) || texto.includes(nombre);
}

function esEjercicioProtegido(
    ejercicio: EjercicioRutina,
    solicitud: SolicitudRutinaInterpretada
) {
    return solicitud.mantenerEjercicios.some((texto) =>
        esMismoEjercicio(ejercicio, texto)
    );
}

function esDiaObjetivo(
    dia: { dia: number; titulo: string },
    solicitud: SolicitudRutinaInterpretada
) {
    if (solicitud.diaObjetivo !== null) {
        return dia.dia === solicitud.diaObjetivo;
    }

    if (solicitud.tituloDiaObjetivo) {
        return normalizarTexto(dia.titulo).includes(
            normalizarTexto(solicitud.tituloDiaObjetivo)
        );
    }

    return true;
}

function normalizarEquipamiento(valor: string | null | undefined) {
    return normalizarTexto(valor)
        .replace(/\bmaquinas\b/g, "maquina")
        .replace(/\bmancuerna\b/g, "mancuernas")
        .replace(/\bbarras\b/g, "barra")
        .replace(/\bpoleas\b/g, "polea")
        .replace(/\bbancos\b/g, "banco");
}

function equipamientoIncluye(
    equipamientoEjercicio: string | null,
    equipamientos: string[]
) {
    if (equipamientos.length === 0) {
        return false;
    }

    const textoEquipamiento = normalizarEquipamiento(equipamientoEjercicio);

    return equipamientos.some((equipamiento) => {
        const equipoNormalizado = normalizarEquipamiento(equipamiento);

        return (
            textoEquipamiento.includes(equipoNormalizado) ||
            equipoNormalizado.includes(textoEquipamiento)
        );
    });
}

function obtenerDificultadObjetivo(
    dificultadActual: string | null | undefined,
    dificultad: SolicitudRutinaInterpretada["dificultad"]
) {
    const actual = normalizarTexto(dificultadActual);

    if (dificultad === "mas_facil") {
        return "principiante";
    }

    if (dificultad === "mas_dificil") {
        if (actual === "principiante") {
            return "intermedio";
        }

        return "avanzado";
    }

    return undefined;
}

function actualizarExplicacionPorCambioManual(
    ejercicio: EjercicioRutina,
    seriesAntes: number,
    motivo: string
): EjercicioRutina {
    if (ejercicio.series === seriesAntes) {
        return ejercicio;
    }

    return {
        ...ejercicio,
        explicacion_progresion: {
            accion: ejercicio.series > seriesAntes ? "subir_series" : "bajar_series",
            estado: ejercicio.explicacion_progresion?.estado ?? "neutro",
            motivo,
            seriesOriginales: seriesAntes,
            seriesFinales: ejercicio.series,
            nombreOriginal: ejercicio.nombre,
            nombreFinal: ejercicio.nombre,
        },
    };
}

function obtenerEjercicioCatalogoPorId(
    ejerciciosCatalogo: Ejercicio[],
    ejercicioRutina: EjercicioRutina
) {
    return ejerciciosCatalogo.find((ejercicio) => ejercicio.id === ejercicioRutina.id) ?? null;
}

function ejercicioUsaEquipamientoPreferido(
    ejercicioRutina: EjercicioRutina,
    ejerciciosCatalogo: Ejercicio[],
    solicitud: SolicitudRutinaInterpretada
) {
    if (solicitud.preferirEquipamiento.length === 0) {
        return false;
    }

    const ejercicioCatalogo = obtenerEjercicioCatalogoPorId(
        ejerciciosCatalogo,
        ejercicioRutina
    );

    if (!ejercicioCatalogo) {
        return false;
    }

    return equipamientoIncluye(
        ejercicioCatalogo.equipamiento,
        solicitud.preferirEquipamiento
    );
}

function debeBuscarAlternativaPorEquipamientoPreferido(
    ejercicioRutina: EjercicioRutina,
    ejerciciosCatalogo: Ejercicio[],
    solicitud: SolicitudRutinaInterpretada
) {
    if (solicitud.preferirEquipamiento.length === 0) {
        return false;
    }

    return !ejercicioUsaEquipamientoPreferido(
        ejercicioRutina,
        ejerciciosCatalogo,
        solicitud
    );
}

function calcularCambioSeries(
    ejercicio: EjercicioRutina,
    solicitud: SolicitudRutinaInterpretada
) {
    const grupo = normalizarTexto(ejercicio.grupo_muscular);

    let cambio = 0;

    if (solicitud.aumentarGrupos.includes(grupo)) {
        cambio += 1;
    }

    if (solicitud.reducirGrupos.includes(grupo)) {
        cambio -= 1;
    }

    if (solicitud.duracion === "mas_corta") {
        cambio -= 1;
    }

    return cambio;
}

function buscarAlternativa(
    ejercicioActual: EjercicioRutina,
    ejerciciosCatalogo: Ejercicio[],
    solicitud: SolicitudRutinaInterpretada,
    nombresYaUsados: string[],
    equipamientoDisponiblePerfil?: string | null,
    molestiasPerfil?: string | null,
    opcionesBusqueda?: {
        exigirEquipamientoPreferido?: boolean;
    }
) {
    const dificultadObjetivo = obtenerDificultadObjetivo(
        ejercicioActual.dificultad,
        solicitud.dificultad
    );

    function candidatoValido(candidato: Ejercicio) {
        if (candidato.id === ejercicioActual.id) {
            return false;
        }

        if (
            nombresYaUsados.some(
                (nombre) => normalizarTexto(nombre) === normalizarTexto(candidato.nombre)
            )
        ) {
            return false;
        }

        if (
            solicitud.excluirEquipamiento.length > 0 &&
            equipamientoIncluye(candidato.equipamiento, solicitud.excluirEquipamiento)
        ) {
            return false;
        }

        if (
            opcionesBusqueda?.exigirEquipamientoPreferido &&
            !equipamientoIncluye(candidato.equipamiento, solicitud.preferirEquipamiento)
        ) {
            return false;
        }

        return true;
    }

    const candidatosBase = seleccionarEjerciciosFiltrados(ejerciciosCatalogo, {
        grupoMuscular: ejercicioActual.grupo_muscular,
        patronMovimiento: ejercicioActual.patron_movimiento ?? undefined,
        dificultad: dificultadObjetivo,
        equipoDisponiblePerfil: equipamientoDisponiblePerfil ?? null,
        molestiasPerfil: molestiasPerfil ?? null,
    }).filter(candidatoValido);

    const candidatos =
        candidatosBase.length > 0
            ? candidatosBase
            : seleccionarEjerciciosFiltrados(ejerciciosCatalogo, {
                grupoMuscular: ejercicioActual.grupo_muscular,
                patronMovimiento: ejercicioActual.patron_movimiento ?? undefined,
                equipoDisponiblePerfil: equipamientoDisponiblePerfil ?? null,
                molestiasPerfil: molestiasPerfil ?? null,
            }).filter(candidatoValido);

    if (candidatos.length === 0) {
        return null;
    }

    if (solicitud.preferirEquipamiento.length > 0) {
        const preferido = candidatos.find((candidato) =>
            equipamientoIncluye(candidato.equipamiento, solicitud.preferirEquipamiento)
        );

        if (preferido) {
            return preferido;
        }

        if (opcionesBusqueda?.exigirEquipamientoPreferido) {
            return null;
        }
    }

    return candidatos[0] ?? null;
}

function convertirAlternativa(
    ejercicioActual: EjercicioRutina,
    alternativa: Ejercicio
): EjercicioRutina {
    return {
        ...ejercicioActual,
        id: alternativa.id,
        nombre: alternativa.nombre,
        grupo_muscular: alternativa.grupo_muscular,
        patron_movimiento: alternativa.patron_movimiento,
        dificultad: alternativa.dificultad,
        explicacion_progresion: {
            accion: "cambiar_variante",
            estado: "neutro",
            motivo: "Cambio aplicado a partir de una solicitud escrita por el usuario.",
            seriesOriginales: ejercicioActual.series,
            seriesFinales: ejercicioActual.series,
            nombreOriginal: ejercicioActual.nombre,
            nombreFinal: alternativa.nombre,
        },
    };
}

function formatearCambioDia(diaTitulo: string, mensaje: string) {
    return `${diaTitulo}: ${mensaje}`;
}

function obtenerGrupoExtraPorTituloDia(
    tituloDia: string,
    ejercicios: EjercicioRutina[]
) {
    const titulo = normalizarTexto(tituloDia);

    if (titulo.includes("torso")) {
        const gruposTorso = ["pecho", "espalda", "hombro", "biceps", "triceps"];
        const gruposActuales = ejercicios.map((ejercicio) =>
            normalizarTexto(ejercicio.grupo_muscular)
        );

        return (
            gruposTorso
                .map((grupo) => ({
                    grupo,
                    cantidad: gruposActuales.filter((actual) => actual === grupo).length,
                }))
                .sort((a, b) => a.cantidad - b.cantidad)[0]?.grupo ?? "pecho"
        );
    }

    if (titulo.includes("pierna")) {
        return "pierna";
    }

    const gruposActuales = ejercicios.map((ejercicio) =>
        normalizarTexto(ejercicio.grupo_muscular)
    );

    const gruposDisponibles = ["pecho", "espalda", "pierna", "hombro", "biceps", "triceps"];

    return (
        gruposDisponibles
            .map((grupo) => ({
                grupo,
                cantidad: gruposActuales.filter((actual) => actual === grupo).length,
            }))
            .sort((a, b) => a.cantidad - b.cantidad)[0]?.grupo ?? "pecho"
    );
}

function crearEjercicioRutinaExtra(ejercicio: Ejercicio): EjercicioRutina {
    return {
        id: ejercicio.id,
        nombre: ejercicio.nombre,
        grupo_muscular: ejercicio.grupo_muscular,
        patron_movimiento: ejercicio.patron_movimiento,
        dificultad: ejercicio.dificultad,
        series: 2,
        repeticiones:
            ejercicio.patron_movimiento === "aislamiento" ? "10-15" : "8-12",
        explicacion_progresion: {
            accion: "subir_series",
            estado: "neutro",
            motivo:
                "Ejercicio añadido a partir de una solicitud escrita por el usuario para alargar la sesión.",
            seriesOriginales: 0,
            seriesFinales: 2,
            nombreOriginal: ejercicio.nombre,
            nombreFinal: ejercicio.nombre,
        },
    };
}

function buscarEjercicioExtraParaDia(
    tituloDia: string,
    ejerciciosDia: EjercicioRutina[],
    ejerciciosCatalogo: Ejercicio[],
    solicitud: SolicitudRutinaInterpretada,
    opciones?: {
        equipamientoDisponiblePerfil?: string | null;
        molestiasPerfil?: string | null;
    }
) {
    const gruposAumentar = solicitud.aumentarGrupos.map((grupo) =>
        normalizarTexto(grupo)
    );

    const grupoObjetivo =
        gruposAumentar.length > 0
            ? gruposAumentar[0]
            : obtenerGrupoExtraPorTituloDia(tituloDia, ejerciciosDia);

    const nombresUsados = ejerciciosDia.map((ejercicio) =>
        normalizarTexto(ejercicio.nombre)
    );

    const candidatos = seleccionarEjerciciosFiltrados(ejerciciosCatalogo, {
        grupoMuscular: grupoObjetivo,
        equipoDisponiblePerfil: opciones?.equipamientoDisponiblePerfil ?? null,
        molestiasPerfil: opciones?.molestiasPerfil ?? null,
    }).filter((ejercicio) => {
        if (nombresUsados.includes(normalizarTexto(ejercicio.nombre))) {
            return false;
        }

        if (
            solicitud.excluirEquipamiento.length > 0 &&
            equipamientoIncluye(ejercicio.equipamiento, solicitud.excluirEquipamiento)
        ) {
            return false;
        }

        return true;
    });

    if (solicitud.preferirEquipamiento.length > 0) {
        const candidatoPreferido = candidatos.find((ejercicio) =>
            equipamientoIncluye(ejercicio.equipamiento, solicitud.preferirEquipamiento)
        );

        if (candidatoPreferido) {
            return crearEjercicioRutinaExtra(candidatoPreferido);
        }
    }

    const candidato = candidatos[0];

    if (!candidato) {
        return null;
    }

    return crearEjercicioRutinaExtra(candidato);
}

export function aplicarSolicitudRutina(
    rutina: RutinaGenerada,
    solicitud: SolicitudRutinaInterpretada,
    ejerciciosCatalogo: Ejercicio[],
    opciones?: {
        equipamientoDisponiblePerfil?: string | null;
        molestiasPerfil?: string | null;
    }
): ResultadoAplicacionSolicitud {
    const cambios: string[] = [];

    let dias = rutina.dias.map((dia) => {
        if (!esDiaObjetivo(dia, solicitud)) {
            return dia;
        }

        const nombresOriginalesDia = dia.ejercicios.map((ejercicio) => ejercicio.nombre);
        const nombresUsadosEnDia = new Set(
            dia.ejercicios.map((ejercicio) => normalizarTexto(ejercicio.nombre))
        );

        let ejercicios = dia.ejercicios
            .filter((ejercicio) => {
                const grupo = normalizarTexto(ejercicio.grupo_muscular);

                if (esEjercicioProtegido(ejercicio, solicitud)) {
                    return true;
                }

                if (solicitud.excluirGrupos.includes(grupo)) {
                    cambios.push(
                        formatearCambioDia(
                            dia.titulo,
                            `se ha eliminado ${ejercicio.nombre} por grupo muscular.`
                        )
                    );
                    return false;
                }

                return true;
            })
            .map((ejercicio) => {
                let actual = { ...ejercicio };
                const seriesAntes = actual.series;
                const protegido = esEjercicioProtegido(actual, solicitud);

                const debeSustituirPorNombre = solicitud.excluirEjercicios.some((texto) =>
                    esMismoEjercicio(actual, texto)
                );

                if (!protegido) {
                    const cambioSeries = calcularCambioSeries(actual, solicitud);

                    if (cambioSeries !== 0) {
                        actual.series = limitarSeries(actual.series + cambioSeries);
                    }
                }

                if (actual.series > seriesAntes) {
                    cambios.push(
                        formatearCambioDia(
                            dia.titulo,
                            `se ha aumentado el volumen de ${actual.nombre}: ${seriesAntes} → ${actual.series} series.`
                        )
                    );

                    actual = actualizarExplicacionPorCambioManual(
                        actual,
                        seriesAntes,
                        "Aumento de volumen aplicado a partir de una solicitud escrita por el usuario."
                    );
                }

                if (actual.series < seriesAntes) {
                    cambios.push(
                        formatearCambioDia(
                            dia.titulo,
                            `se ha reducido el volumen de ${actual.nombre}: ${seriesAntes} → ${actual.series} series.`
                        )
                    );

                    actual = actualizarExplicacionPorCambioManual(
                        actual,
                        seriesAntes,
                        "Reducción de volumen aplicada a partir de una solicitud escrita por el usuario."
                    );
                }

                const debeSustituirPorPreferenciaEquipamiento =
                    debeBuscarAlternativaPorEquipamientoPreferido(
                        actual,
                        ejerciciosCatalogo,
                        solicitud
                    );

                const debeSustituirPorEquipamientoExcluido =
                    solicitud.excluirEquipamiento.length > 0 &&
                    equipamientoIncluye(
                        obtenerEjercicioCatalogoPorId(ejerciciosCatalogo, actual)?.equipamiento ?? null,
                        solicitud.excluirEquipamiento
                    );

                if (
                    !protegido &&
                    (debeSustituirPorNombre ||
                        solicitud.dificultad !== null ||
                        debeSustituirPorPreferenciaEquipamiento ||
                        debeSustituirPorEquipamientoExcluido)
                ) {
                    nombresUsadosEnDia.delete(normalizarTexto(actual.nombre));

                    const alternativa = buscarAlternativa(
                        actual,
                        ejerciciosCatalogo,
                        solicitud,
                        [
                            ...Array.from(nombresUsadosEnDia),
                            ...nombresOriginalesDia.filter(
                                (nombre) =>
                                    normalizarTexto(nombre) !== normalizarTexto(actual.nombre)
                            ),
                        ],
                        opciones?.equipamientoDisponiblePerfil,
                        opciones?.molestiasPerfil,
                        {
                            exigirEquipamientoPreferido:
                                debeSustituirPorPreferenciaEquipamiento &&
                                !debeSustituirPorNombre &&
                                solicitud.dificultad === null &&
                                !debeSustituirPorEquipamientoExcluido,
                        }
                    );

                    if (alternativa) {
                        const nombreOriginal = actual.nombre;
                        actual = convertirAlternativa(actual, alternativa);

                        if (nombreOriginal !== actual.nombre) {
                            cambios.push(
                                formatearCambioDia(
                                    dia.titulo,
                                    `${nombreOriginal} se ha cambiado por ${actual.nombre}.`
                                )
                            );
                        }

                        nombresUsadosEnDia.add(normalizarTexto(actual.nombre));
                    } else {
                        nombresUsadosEnDia.add(normalizarTexto(actual.nombre));
                    }
                }

                return actual;
            });

        if (solicitud.duracion === "mas_corta" && ejercicios.length > 3) {
            const indiceAislamiento = ejercicios.findLastIndex(
                (ejercicio) =>
                    ejercicio.patron_movimiento === "aislamiento" &&
                    !esEjercicioProtegido(ejercicio, solicitud)
            );

            if (indiceAislamiento >= 0) {
                cambios.push(
                    formatearCambioDia(
                        dia.titulo,
                        `se ha quitado ${ejercicios[indiceAislamiento].nombre} para acortar la sesión.`
                    )
                );

                ejercicios = ejercicios.filter((_, indice) => indice !== indiceAislamiento);
            }
        }

        if (solicitud.duracion === "mas_larga" && ejercicios.length < 7) {
            const ejercicioExtra = buscarEjercicioExtraParaDia(
                dia.titulo,
                ejercicios,
                ejerciciosCatalogo,
                solicitud,
                opciones
            );

            if (ejercicioExtra) {
                ejercicios = [...ejercicios, ejercicioExtra];

                cambios.push(
                    formatearCambioDia(
                        dia.titulo,
                        `se ha añadido ${ejercicioExtra.nombre} para alargar la sesión.`
                    )
                );
            }
        }

        return {
            ...dia,
            ejercicios,
        };
    });

    dias = dias.filter((dia) => dia.ejercicios.length > 0);

    if (solicitud.intensidad === "mas_suave") {
        dias = dias.map((dia) => {
            if (!esDiaObjetivo(dia, solicitud)) {
                return dia;
            }

            return {
                ...dia,
                ejercicios: dia.ejercicios.map((ejercicio) => {
                    if (esEjercicioProtegido(ejercicio, solicitud)) {
                        return ejercicio;
                    }

                    const seriesAntes = ejercicio.series;
                    const actualizado = {
                        ...ejercicio,
                        series: limitarSeries(ejercicio.series - 1),
                    };

                    if (actualizado.series < seriesAntes) {
                        cambios.push(
                            formatearCambioDia(
                                dia.titulo,
                                `se ha reducido la intensidad de ${actualizado.nombre}: ${seriesAntes} → ${actualizado.series} series.`
                            )
                        );

                        return actualizarExplicacionPorCambioManual(
                            actualizado,
                            seriesAntes,
                            "Reducción de intensidad general aplicada a partir de una solicitud escrita por el usuario."
                        );
                    }

                    return actualizado;
                }),
            };
        });
    }

    if (solicitud.intensidad === "mas_intensa") {
        dias = dias.map((dia) => {
            if (!esDiaObjetivo(dia, solicitud)) {
                return dia;
            }

            return {
                ...dia,
                ejercicios: dia.ejercicios.map((ejercicio) => {
                    if (esEjercicioProtegido(ejercicio, solicitud)) {
                        return ejercicio;
                    }

                    const seriesAntes = ejercicio.series;
                    const actualizado = {
                        ...ejercicio,
                        series: limitarSeries(ejercicio.series + 1),
                    };

                    if (actualizado.series > seriesAntes) {
                        cambios.push(
                            formatearCambioDia(
                                dia.titulo,
                                `se ha aumentado la intensidad de ${actualizado.nombre}: ${seriesAntes} → ${actualizado.series} series.`
                            )
                        );

                        return actualizarExplicacionPorCambioManual(
                            actualizado,
                            seriesAntes,
                            "Aumento de intensidad general aplicado a partir de una solicitud escrita por el usuario."
                        );
                    }

                    return actualizado;
                }),
            };
        });
    }

    if (cambios.length === 0) {
        cambios.push(
            "La solicitud se ha interpretado, pero no ha provocado cambios claros en la rutina actual."
        );
    }

    return {
        rutina: {
            ...rutina,
            dias,
        },
        cambios: Array.from(new Set(cambios)),
    };
}