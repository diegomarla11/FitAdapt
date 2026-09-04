type DatosDescanso = {
  grupoMuscular: string;
  series: number;
  repeticiones: string;
};

function obtenerNumeroMinimoRepeticiones(repeticiones: string) {
  const numeros = repeticiones.match(/\d+/g)?.map(Number) ?? [];

  if (numeros.length === 0) {
    return null;
  }

  return Math.min(...numeros);
}

export function calcularDescansoRecomendado({
  grupoMuscular,
  series,
  repeticiones,
}: DatosDescanso) {
  const repeticionesMinimas = obtenerNumeroMinimoRepeticiones(repeticiones);
  const grupo = grupoMuscular.toLowerCase();

  const esGrupoGrande =
    grupo.includes("pierna") ||
    grupo.includes("espalda") ||
    grupo.includes("pecho");

  const esTrabajoPesado =
    series >= 4 || (repeticionesMinimas !== null && repeticionesMinimas <= 6);

  const esTrabajoAccesorio =
    grupo.includes("biceps") ||
    grupo.includes("triceps") ||
    grupo.includes("hombro");

  if (esTrabajoPesado && esGrupoGrande) {
    return 120;
  }

  if (esTrabajoPesado) {
    return 90;
  }

  if (esTrabajoAccesorio && repeticionesMinimas !== null && repeticionesMinimas >= 10) {
    return 60;
  }

  return 90;
}