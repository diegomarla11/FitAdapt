export type SensacionEntrenamiento = "facil" | "bien" | "dificil" | null;

export type SugerenciaEntrenamiento = {
  titulo: string;
  accion: string;
  descripcion: string;
};

export function formatearSensacionEntrenamiento(
  sensacion: SensacionEntrenamiento
) {
  if (sensacion === "facil") {
    return "Fácil";
  }

  if (sensacion === "bien") {
    return "Bien";
  }

  if (sensacion === "dificil") {
    return "Difícil";
  }

  return "No indicada";
}

export function obtenerSugerenciaEntrenamiento(
  sensacion: SensacionEntrenamiento
): SugerenciaEntrenamiento {
  if (sensacion === "facil") {
    return {
      titulo: "Posible progresión",
      accion: "Valorar subir ligeramente la exigencia",
      descripcion:
        "El último registro fue fácil. Puedes repetir la técnica y valorar subir un poco la carga, las repeticiones o la dificultad si te ves preparado.",
    };
  }

  if (sensacion === "dificil") {
    return {
      titulo: "Controlar fatiga",
      accion: "Mantener o reducir exigencia",
      descripcion:
        "El último registro fue difícil. Conviene priorizar una ejecución correcta y evitar aumentar la carga o el volumen en este ejercicio.",
    };
  }

  if (sensacion === "bien") {
    return {
      titulo: "Rendimiento estable",
      accion: "Repetir una carga similar",
      descripcion:
        "El último registro fue estable. Puedes repetir una carga parecida y centrarte en completar las series previstas.",
    };
  }

  return {
    titulo: "Sin referencia suficiente",
    accion: "Registrar datos reales",
    descripcion:
      "Todavía no hay una sensación clara registrada. Usa los valores sugeridos como referencia y registra cómo te ha ido hoy.",
  };
}