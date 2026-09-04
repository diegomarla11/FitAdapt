export type SolicitudRutinaInterpretada = {
    textoOriginal: string;
    aumentarGrupos: string[];
    reducirGrupos: string[];
    excluirGrupos: string[];
    preferirEquipamiento: string[];
    excluirEquipamiento: string[];
    excluirEjercicios: string[];
    mantenerEjercicios: string[];
    duracion: "mas_corta" | "mas_larga" | null;
    dificultad: "mas_facil" | "mas_dificil" | null;
    intensidad: "mas_suave" | "mas_intensa" | null;
    diaObjetivo: number | null;
    tituloDiaObjetivo: string | null;
    duracionObjetivoMinutos: number | null;
    resumenInterpretacion: string[];
    mensajes: string[];
};

const GRUPOS_MUSCULARES = [
    "pecho",
    "espalda",
    "pierna",
    "hombro",
    "biceps",
    "triceps",
];

const EQUIPAMIENTOS = [
    "mancuernas",
    "barra",
    "polea",
    "maquina",
    "máquina",
    "banco",
    "peso corporal",
];

const PALABRAS_ACCION = [
    "mas",
    "menos",
    "aumentar",
    "subir",
    "reducir",
    "bajar",
    "quitar",
    "evitar",
    "eliminar",
    "sin",
    "usar",
    "usa",
    "priorizar",
    "mantener",
    "manten",
    "mantén",
    "cambiar",
    "sustituir",
];

function normalizarTexto(texto: string) {
    return texto
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[.,;:!?¿¡]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function limpiarDuplicados(valores: string[]) {
    return Array.from(new Set(valores));
}

function textoIncluye(texto: string, valor: string) {
    return texto.includes(normalizarTexto(valor));
}

function contieneAlguna(texto: string, frases: string[]) {
    return frases.some((frase) => texto.includes(normalizarTexto(frase)));
}

function detectarDiaObjetivo(texto: string) {
    const matchDia = texto.match(/\bdia\s*([1-7])\b/);

    if (!matchDia) {
        return null;
    }

    const dia = Number(matchDia[1]);

    if (!Number.isInteger(dia) || dia < 1 || dia > 7) {
        return null;
    }

    return dia;
}

function detectarTituloDiaObjetivo(texto: string) {
    if (texto.includes("torso a")) return "torso a";
    if (texto.includes("torso b")) return "torso b";
    if (texto.includes("torso c")) return "torso c";
    if (texto.includes("pierna a")) return "pierna a";
    if (texto.includes("pierna b")) return "pierna b";
    if (texto.includes("pierna c")) return "pierna c";
    if (texto.includes("full body a")) return "full body a";
    if (texto.includes("full body b")) return "full body b";
    if (texto.includes("full body c")) return "full body c";

    return null;
}

function detectarDuracionObjetivo(texto: string) {
    const match = texto.match(/\b(\d{2,3})\s*(min|minutos|minute|minutes)\b/);

    if (!match) {
        return null;
    }

    const minutos = Number(match[1]);

    if (!Number.isFinite(minutos) || minutos < 15 || minutos > 180) {
        return null;
    }

    return minutos;
}

function detectarGruposPorContexto(texto: string, palabrasClave: string[]) {
    const grupos: string[] = [];

    for (const grupo of GRUPOS_MUSCULARES) {
        const expresiones = palabrasClave.flatMap((palabra) => [
            `${palabra} ${grupo}`,
            `${palabra} de ${grupo}`,
            `${palabra} ejercicios de ${grupo}`,
            `${palabra} volumen de ${grupo}`,
            `${palabra} trabajo de ${grupo}`,
        ]);

        if (expresiones.some((expresion) => texto.includes(normalizarTexto(expresion)))) {
            grupos.push(grupo);
        }
    }

    return grupos;
}

function detectarEquipamientoPorContexto(texto: string, palabrasClave: string[]) {
    const equipamientos: string[] = [];

    for (const equipamiento of EQUIPAMIENTOS) {
        const equipoNormalizado = normalizarTexto(equipamiento);

        const expresiones = palabrasClave.flatMap((palabra) => [
            `${palabra} ${equipoNormalizado}`,
            `${palabra} con ${equipoNormalizado}`,
            `${palabra} ejercicios con ${equipoNormalizado}`,
            `${palabra} ejercicios de ${equipoNormalizado}`,
        ]);

        if (expresiones.some((expresion) => texto.includes(normalizarTexto(expresion)))) {
            equipamientos.push(equipoNormalizado === "máquina" ? "maquina" : equipoNormalizado);
        }
    }

    return equipamientos;
}

function extraerTextoDespuesDeMarcadores(texto: string, marcadores: string[]) {
    const resultados: string[] = [];

    for (const marcador of marcadores) {
        const marcadorNormalizado = normalizarTexto(marcador);
        const indice = texto.indexOf(marcadorNormalizado);

        if (indice === -1) {
            continue;
        }

        const fragmento = texto
            .slice(indice + marcadorNormalizado.length)
            .split(/\b(?:y|pero|ademas|tambien|en el dia|del dia|dia [1-7])\b/)[0]
            .trim();

        if (!fragmento) {
            continue;
        }

        const palabras = fragmento
            .split(" ")
            .filter(Boolean)
            .filter((palabra) => !PALABRAS_ACCION.includes(palabra));

        const candidato = palabras.join(" ").trim();

        if (candidato.length >= 3) {
            resultados.push(candidato);
        }
    }

    return resultados;
}

function detectarEjerciciosExcluidos(texto: string) {
    return extraerTextoDespuesDeMarcadores(texto, [
        "quita",
        "quitar",
        "evita",
        "evitar",
        "elimina",
        "eliminar",
        "sustituye",
        "sustituir",
        "cambia",
        "cambiar",
        "no quiero",
        "no incluir",
        "no meter",
    ]).filter(
        (valor) =>
            !GRUPOS_MUSCULARES.includes(valor) &&
            !EQUIPAMIENTOS.map((item) => normalizarTexto(item)).includes(valor)
    );
}

function detectarEjerciciosProtegidos(texto: string) {
    return extraerTextoDespuesDeMarcadores(texto, [
        "mantener",
        "mantén",
        "manten",
        "no cambies",
        "no tocar",
        "deja",
        "conserva",
        "conservar",
    ]).filter(
        (valor) =>
            !GRUPOS_MUSCULARES.includes(valor) &&
            !EQUIPAMIENTOS.map((item) => normalizarTexto(item)).includes(valor)
    );
}

function generarResumenInterpretacion(resultado: SolicitudRutinaInterpretada) {
    const resumen: string[] = [];

    if (resultado.diaObjetivo !== null) {
        resumen.push(`Aplicar solo al día ${resultado.diaObjetivo}.`);
    }

    if (resultado.tituloDiaObjetivo) {
        resumen.push(`Aplicar solo a ${resultado.tituloDiaObjetivo}.`);
    }

    if (resultado.aumentarGrupos.length > 0) {
        resumen.push(`Aumentar volumen de: ${resultado.aumentarGrupos.join(", ")}.`);
    }

    if (resultado.reducirGrupos.length > 0) {
        resumen.push(`Reducir volumen de: ${resultado.reducirGrupos.join(", ")}.`);
    }

    if (resultado.excluirGrupos.length > 0) {
        resumen.push(`Eliminar grupos: ${resultado.excluirGrupos.join(", ")}.`);
    }

    if (resultado.preferirEquipamiento.length > 0) {
        resumen.push(`Priorizar equipamiento: ${resultado.preferirEquipamiento.join(", ")}.`);
    }

    if (resultado.excluirEquipamiento.length > 0) {
        resumen.push(`Evitar equipamiento: ${resultado.excluirEquipamiento.join(", ")}.`);
    }

    if (resultado.excluirEjercicios.length > 0) {
        resumen.push(`Sustituir o eliminar ejercicios: ${resultado.excluirEjercicios.join(", ")}.`);
    }

    if (resultado.mantenerEjercicios.length > 0) {
        resumen.push(`Mantener ejercicios: ${resultado.mantenerEjercicios.join(", ")}.`);
    }

    if (resultado.duracion === "mas_corta") {
        resumen.push("Hacer la rutina más corta.");
    }

    if (resultado.duracion === "mas_larga") {
        resumen.push("Hacer la rutina más larga.");
    }

    if (resultado.duracionObjetivoMinutos !== null) {
        resumen.push(`Duración objetivo detectada: ${resultado.duracionObjetivoMinutos} minutos.`);
    }

    if (resultado.dificultad === "mas_facil") {
        resumen.push("Buscar variantes más fáciles.");
    }

    if (resultado.dificultad === "mas_dificil") {
        resumen.push("Buscar variantes más difíciles.");
    }

    if (resultado.intensidad === "mas_suave") {
        resumen.push("Reducir intensidad general.");
    }

    if (resultado.intensidad === "mas_intensa") {
        resumen.push("Aumentar intensidad general.");
    }

    return resumen;
}

export function interpretarSolicitudRutina(
    textoUsuario: string
): SolicitudRutinaInterpretada {
    const texto = normalizarTexto(textoUsuario);

    const resultado: SolicitudRutinaInterpretada = {
        textoOriginal: textoUsuario,
        aumentarGrupos: [],
        reducirGrupos: [],
        excluirGrupos: [],
        preferirEquipamiento: [],
        excluirEquipamiento: [],
        excluirEjercicios: [],
        mantenerEjercicios: [],
        duracion: null,
        dificultad: null,
        intensidad: null,
        diaObjetivo: null,
        tituloDiaObjetivo: null,
        duracionObjetivoMinutos: null,
        resumenInterpretacion: [],
        mensajes: [],
    };

    if (!texto) {
        resultado.mensajes.push("No se ha indicado ninguna solicitud.");
        return resultado;
    }

    resultado.diaObjetivo = detectarDiaObjetivo(texto);
    resultado.tituloDiaObjetivo = detectarTituloDiaObjetivo(texto);
    resultado.duracionObjetivoMinutos = detectarDuracionObjetivo(texto);

    resultado.aumentarGrupos = detectarGruposPorContexto(texto, [
        "mas",
        "aumentar",
        "subir",
        "priorizar",
        "quiero mas",
        "meter mas",
        "enfocar mas",
    ]);

    resultado.reducirGrupos = detectarGruposPorContexto(texto, [
        "menos",
        "reducir",
        "bajar",
        "quitar volumen de",
        "hacer menos",
    ]);

    resultado.excluirGrupos = detectarGruposPorContexto(texto, [
        "evitar",
        "sin",
        "quitar",
        "eliminar",
        "no quiero",
        "no incluir",
        "no meter",
    ]);

    resultado.preferirEquipamiento = detectarEquipamientoPorContexto(texto, [
        "usar",
        "usa",
        "con",
        "mas",
        "priorizar",
        "quiero",
    ]);

    resultado.excluirEquipamiento = detectarEquipamientoPorContexto(texto, [
        "evitar",
        "sin",
        "quitar",
        "eliminar",
        "no quiero",
        "no incluir",
        "no usar",
    ]);

    resultado.excluirEjercicios = detectarEjerciciosExcluidos(texto);
    resultado.mantenerEjercicios = detectarEjerciciosProtegidos(texto);

    if (
        contieneAlguna(texto, [
            "mas corta",
            "mas corto",
            "hacer corta",
            "hacer corto",
            "hazla mas corta",
            "hazlo mas corto",
            "menos tiempo",
            "rapida",
            "rapido",
            "poco tiempo",
            "sesion corta",
            "entrenamiento corto",
        ])
    ) {
        resultado.duracion = "mas_corta";
    }

    if (
        contieneAlguna(texto, [
            "mas larga",
            "mas largo",
            "hacer larga",
            "hacer largo",
            "hazla mas larga",
            "hazlo mas largo",
            "haz el dia mas largo",
            "haz el dia mas completo",
            "mas volumen general",
            "mas completa",
            "mas completo",
            "sesion larga",
            "entrenamiento largo",
            "dia mas largo",
            "dia mas completo",
        ])
    ) {
        resultado.duracion = "mas_larga";
    }

    if (resultado.duracionObjetivoMinutos !== null) {
        if (resultado.duracionObjetivoMinutos <= 45) {
            resultado.duracion = "mas_corta";
        }

        if (resultado.duracionObjetivoMinutos >= 90) {
            resultado.duracion = "mas_larga";
        }
    }

    if (
        contieneAlguna(texto, [
            "mas facil",
            "mas sencilla",
            "menos dificil",
            "bajar dificultad",
            "suave",
            "mas suave",
        ])
    ) {
        resultado.dificultad = "mas_facil";
        resultado.intensidad = "mas_suave";
    }

    if (
        contieneAlguna(texto, [
            "mas dificil",
            "mas intensa",
            "mas duro",
            "subir dificultad",
            "intensa",
            "exigente",
        ])
    ) {
        resultado.dificultad = "mas_dificil";
        resultado.intensidad = "mas_intensa";
    }

    for (const grupo of GRUPOS_MUSCULARES) {
        const apareceGrupo = textoIncluye(texto, grupo);

        if (!apareceGrupo) {
            continue;
        }

        const yaClasificado =
            resultado.aumentarGrupos.includes(grupo) ||
            resultado.reducirGrupos.includes(grupo) ||
            resultado.excluirGrupos.includes(grupo);

        if (!yaClasificado) {
            if (texto.includes(`mas ${grupo}`) || texto.includes(`quiero mas ${grupo}`)) {
                resultado.aumentarGrupos.push(grupo);
            }

            if (texto.includes(`menos ${grupo}`) || texto.includes(`quiero menos ${grupo}`)) {
                resultado.reducirGrupos.push(grupo);
            }

            if (texto.includes(`sin ${grupo}`) || texto.includes(`evita ${grupo}`)) {
                resultado.excluirGrupos.push(grupo);
            }
        }
    }

    resultado.aumentarGrupos = limpiarDuplicados(resultado.aumentarGrupos);
    resultado.reducirGrupos = limpiarDuplicados(resultado.reducirGrupos);
    resultado.excluirGrupos = limpiarDuplicados(resultado.excluirGrupos);
    resultado.preferirEquipamiento = limpiarDuplicados(resultado.preferirEquipamiento);
    resultado.excluirEquipamiento = limpiarDuplicados(resultado.excluirEquipamiento);
    resultado.excluirEjercicios = limpiarDuplicados(resultado.excluirEjercicios);
    resultado.mantenerEjercicios = limpiarDuplicados(resultado.mantenerEjercicios);

    resultado.aumentarGrupos = resultado.aumentarGrupos.filter(
        (grupo) => !resultado.reducirGrupos.includes(grupo)
    );

    resultado.reducirGrupos = resultado.reducirGrupos.filter(
        (grupo) => !resultado.excluirGrupos.includes(grupo)
    );

    resultado.excluirEjercicios = resultado.excluirEjercicios.filter(
        (ejercicio) =>
            !resultado.mantenerEjercicios.some((protegido) =>
                normalizarTexto(ejercicio).includes(normalizarTexto(protegido))
            )
    );

    resultado.resumenInterpretacion = generarResumenInterpretacion(resultado);

    if (
        resultado.aumentarGrupos.length === 0 &&
        resultado.reducirGrupos.length === 0 &&
        resultado.excluirGrupos.length === 0 &&
        resultado.preferirEquipamiento.length === 0 &&
        resultado.excluirEquipamiento.length === 0 &&
        resultado.excluirEjercicios.length === 0 &&
        resultado.mantenerEjercicios.length === 0 &&
        resultado.duracion === null &&
        resultado.dificultad === null &&
        resultado.intensidad === null &&
        resultado.diaObjetivo === null &&
        resultado.tituloDiaObjetivo === null &&
        resultado.duracionObjetivoMinutos === null
    ) {
        resultado.mensajes.push(
            "No se han detectado cambios concretos. Prueba con frases como: quiero más pierna, evita hombro, haz el día 2 más corto, haz el día 3 más largo, quita dominadas o usa más mancuernas."
        );
    }

    return resultado;
}