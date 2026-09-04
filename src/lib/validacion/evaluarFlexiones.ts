import type {
  PuntoPose,
  ResultadoEvaluadorTecnica,
} from "@/tipos/validacionTecnica";
import {
  calcularAngulo,
  calcularDistancia,
  limitarPuntuacion,
  media,
  obtenerEstadoPorPuntuacion,
  obtenerPuntosLadoPreferente,
  obtenerRango,
} from "@/lib/validacion/calcularAngulos";

type FrameFlexion = {
  anguloCodo: number;
  alineacionCuerpo: number;
  horizontalidad: number;
  desviacionCadera: number;
};

function analizarFrameFlexion(puntos: PuntoPose[]): FrameFlexion | null {
  const lado = obtenerPuntosLadoPreferente(puntos);

  if (!lado || !lado.codo || !lado.muneca) {
    return null;
  }

  const anguloCodo = calcularAngulo(lado.hombro, lado.codo, lado.muneca);
  const alineacionCuerpo = calcularAngulo(lado.hombro, lado.cadera, lado.tobillo);

  if (anguloCodo === null || alineacionCuerpo === null) {
    return null;
  }

  const distanciaHorizontal = Math.abs(lado.tobillo.x - lado.hombro.x);
  const distanciaVertical = Math.abs(lado.tobillo.y - lado.hombro.y);
  const horizontalidad = distanciaHorizontal / Math.max(1, distanciaVertical);

  const longitudCuerpo = calcularDistancia(lado.hombro, lado.tobillo);
  const desviacionCadera =
    Math.abs(lado.cadera.y - (lado.hombro.y + lado.tobillo.y) / 2) /
    Math.max(1, longitudCuerpo);

  return {
    anguloCodo,
    alineacionCuerpo,
    horizontalidad,
    desviacionCadera,
  };
}

export function evaluarFlexiones(
  frames: PuntoPose[][],
): ResultadoEvaluadorTecnica {
  const framesValidos = frames
    .map((frame) => analizarFrameFlexion(frame))
    .filter((frame): frame is FrameFlexion => Boolean(frame));

  if (framesValidos.length < 6) {
    return {
      puntuacion: 0,
      estado: "no_evaluable",
      mensajes: [
        "No se han detectado suficientes puntos corporales para evaluar las flexiones.",
        "Graba de lado, con hombros, cadera, tobillos, codos y muñecas visibles.",
      ],
    };
  }

  const proporcionHorizontal =
    framesValidos.filter((frame) => frame.horizontalidad >= 1.05).length /
    framesValidos.length;

  if (proporcionHorizontal < 0.55) {
    return {
      puntuacion: 10,
      estado: "no_evaluable",
      mensajes: [
        "El vídeo no parece corresponder a flexiones.",
        "Debe verse una posición de plancha horizontal, no una postura de pie o sentada.",
      ],
    };
  }

  const angulosCodo = framesValidos.map((frame) => frame.anguloCodo);
  const alineaciones = framesValidos.map((frame) => frame.alineacionCuerpo);
  const desviaciones = framesValidos.map((frame) => frame.desviacionCadera);

  const anguloCodoMinimo = Math.min(...angulosCodo);
  const anguloCodoMaximo = Math.max(...angulosCodo);
  const rangoCodo = obtenerRango(angulosCodo);
  const alineacionMedia = media(alineaciones);
  const desviacionMedia = media(desviaciones);

  if (rangoCodo < 18) {
    return {
      puntuacion: 20,
      estado: "no_evaluable",
      mensajes: [
        "No se aprecia una repetición clara de flexión.",
        "Debe verse una bajada y subida con movimiento evidente de los codos.",
      ],
    };
  }

  const mensajes: string[] = [];
  let puntuacion = 100;
  let limiteMaximo = 100;

  if (anguloCodoMinimo > 125) {
    puntuacion -= 45;
    limiteMaximo = Math.min(limiteMaximo, 50);
    mensajes.push(
      "El rango de movimiento es muy insuficiente: apenas se aprecia flexión profunda de codos.",
    );
  } else if (anguloCodoMinimo > 105) {
    puntuacion -= 30;
    limiteMaximo = Math.min(limiteMaximo, 65);
    mensajes.push(
      "El rango de movimiento parece insuficiente. Intenta bajar más el pecho manteniendo el control.",
    );
  } else {
    mensajes.push("El rango de flexión de los codos parece adecuado.");
  }

  if (anguloCodoMaximo < 145) {
    puntuacion -= 15;
    mensajes.push(
      "La extensión final de los brazos parece incompleta. Empuja hasta una posición alta más clara.",
    );
  }

  if (alineacionMedia < 140) {
    puntuacion -= 40;
    limiteMaximo = Math.min(limiteMaximo, 45);
    mensajes.push(
      "La alineación corporal es deficiente: la cadera parece hundirse o elevarse demasiado.",
    );
  } else if (alineacionMedia < 160) {
    puntuacion -= 25;
    limiteMaximo = Math.min(limiteMaximo, 60);
    mensajes.push(
      "Se detecta pérdida de alineación corporal. Mantén hombros, cadera y tobillos en una línea más estable.",
    );
  } else {
    mensajes.push("La alineación general del cuerpo parece estable.");
  }

  if (desviacionMedia > 0.18) {
    puntuacion -= 20;
    limiteMaximo = Math.min(limiteMaximo, 60);
    mensajes.push(
      "La cadera se desvía de la línea corporal. Activa abdomen y glúteos durante toda la repetición.",
    );
  }

  if (framesValidos.length < 10) {
    puntuacion -= 5;
    mensajes.push(
      "El vídeo tiene pocos frames evaluables. Interpreta el resultado como orientación.",
    );
  }

  const puntuacionFinal = limitarPuntuacion(Math.min(puntuacion, limiteMaximo));

  return {
    puntuacion: puntuacionFinal,
    estado: obtenerEstadoPorPuntuacion(puntuacionFinal),
    mensajes,
  };
}