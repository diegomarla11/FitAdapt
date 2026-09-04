function normalizarTexto(texto: string) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function obtenerMolestiasDetectadas(molestias: string | null) {
  if (!molestias) {
    return [];
  }

  const texto = normalizarTexto(molestias);
  const detectadas: string[] = [];

  if (texto.includes("hombro")) {
    detectadas.push("hombro");
  }

  if (texto.includes("rodilla")) {
    detectadas.push("rodilla");
  }

  if (texto.includes("pierna")) {
    detectadas.push("pierna");
  }

  if (texto.includes("lumbar") || texto.includes("espalda baja")) {
    detectadas.push("lumbar");
  }

  return detectadas;
}

export function patronBloqueadoPorMolestia(
  patronMovimiento: string | undefined,
  molestiasDetectadas: string[]
) {
  if (!patronMovimiento) {
    return false;
  }

  const patron = normalizarTexto(patronMovimiento);

  if (
    molestiasDetectadas.includes("hombro") &&
    (patron === "empuje vertical" || patron === "empuje horizontal")
  ) {
    return true;
  }

  if (
    (molestiasDetectadas.includes("rodilla") ||
      molestiasDetectadas.includes("pierna")) &&
    patron === "dominante de rodilla"
  ) {
    return true;
  }

  if (
    molestiasDetectadas.includes("lumbar") &&
    patron === "dominante de cadera"
  ) {
    return true;
  }

  return false;
}