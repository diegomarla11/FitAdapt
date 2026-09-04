function normalizarTexto(texto: string) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function obtenerEquipamientosPerfil(equipoDisponible: string | null) {
  if (!equipoDisponible) {
    return [];
  }

  return equipoDisponible
    .split(",")
    .map((item) => normalizarTexto(item))
    .filter(Boolean);
}

export function esCompatibleConEquipamiento(
  equipamientoEjercicio: string | null,
  equipamientosPerfil: string[]
) {
  if (!equipamientoEjercicio) {
    return true;
  }

  if (equipamientosPerfil.length === 0) {
    return true;
  }

  const textoEjercicio = normalizarTexto(equipamientoEjercicio);

  const partesEjercicio = textoEjercicio
    .split(/,| y | o /)
    .map((parte) => parte.trim())
    .filter(Boolean);

  return partesEjercicio.every((parte) =>
    equipamientosPerfil.some((equipo) => parte.includes(equipo))
  );
}