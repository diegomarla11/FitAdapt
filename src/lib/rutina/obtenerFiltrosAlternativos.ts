type FiltrosBasicos = {
  grupoMuscular?: string;
  patronMovimiento?: string;
  dificultad?: string;
};

export function obtenerFiltrosAlternativos(
  filtros: FiltrosBasicos
): FiltrosBasicos[] {
  const patron = filtros.patronMovimiento;

  if (patron === "empuje horizontal") {
    return [
      { ...filtros, patronMovimiento: "aislamiento" },
    ];
  }

  if (patron === "empuje vertical") {
    return [
      { ...filtros, patronMovimiento: "aislamiento" },
    ];
  }

  if (patron === "tiron vertical") {
    return [
      { ...filtros, patronMovimiento: "tiron horizontal" },
    ];
  }

  if (patron === "dominante de rodilla") {
    return [
      { ...filtros, patronMovimiento: "aislamiento" },
      { ...filtros, patronMovimiento: "dominante de cadera" },
    ];
  }

  if (patron === "dominante de cadera") {
    return [
      { ...filtros, patronMovimiento: "aislamiento" },
      { ...filtros, patronMovimiento: "dominante de rodilla" },
    ];
  }

  return [];
}