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

type FrameSentadilla = {
  anguloRodilla: number;
  anguloCadera: number;
  verticalidad: number;
  alturaCadera: number;
  distanciaHombroTobillo: number;
};

function analizarFrameSentadilla(puntos: PuntoPose[]): FrameSentadilla | null {
  const lado = obtenerPuntosLadoPreferente(puntos);

  if (!lado || !lado.rodilla) {
    return null;
  }

  const anguloRodilla = calcularAngulo(lado.cadera, lado.rodilla, lado.tobillo);
  const anguloCadera = calcularAngulo(lado.hombro, lado.cadera, lado.rodilla);

  if (anguloRodilla === null || anguloCadera === null) {
    return null;
  }

  const distanciaVertical = Math.abs(lado.tobillo.y - lado.hombro.y);
  const distanciaHorizontal = Math.abs(lado.tobillo.x - lado.hombro.x);
  const verticalidad = distanciaVertical / Math.max(1, distanciaHorizontal);

  return {
    anguloRodilla,
    anguloCadera,
    verticalidad,
    alturaCadera: lado.cadera.y,
    distanciaHombroTobillo: calcularDistancia(lado.hombro, lado.tobillo),
  };
}

export function evaluarSentadilla(
  frames: PuntoPose[][],
): ResultadoEvaluadorTecnica {
  const framesValidos = frames
    .map((frame) => analizarFrameSentadilla(frame))
    .filter((frame): frame is FrameSentadilla => Boolean(frame));

  if (framesValidos.length < 6) {
    return {
      puntuacion: 0,
      estado: "no_evaluable",
      mensajes: [
        "No se han detectado suficientes puntos corporales para evaluar la sentadilla.",
        "Graba de lado, con cuerpo completo visible, pies y cabeza dentro del encuadre.",
      ],
    };
  }

  const verticalidadMedia = media(framesValidos.map((frame) => frame.verticalidad));
  const proporcionDePie =
    framesValidos.filter((frame) => frame.verticalidad >= 0.75).length /
    framesValidos.length;

  const angulosRodilla = framesValidos.map((frame) => frame.anguloRodilla);
  const angulosCadera = framesValidos.map((frame) => frame.anguloCadera);
  const alturasCadera = framesValidos.map((frame) => frame.alturaCadera);

  const anguloRodillaMinimo = Math.min(...angulosRodilla);
  const anguloRodillaMaximo = Math.max(...angulosRodilla);
  const rangoRodilla = obtenerRango(angulosRodilla);
  const anguloCaderaMinimo = Math.min(...angulosCadera);
  const rangoCaderaVertical = obtenerRango(alturasCadera);
  const escalaCuerpo = media(
    framesValidos.map((frame) => frame.distanciaHombroTobillo),
  );
  const rangoCaderaNormalizado = rangoCaderaVertical / Math.max(1, escalaCuerpo);

  if (proporcionDePie < 0.55 || verticalidadMedia < 0.65) {
    return {
      puntuacion: 10,
      estado: "no_evaluable",
      mensajes: [
        "El vídeo no parece corresponder a una sentadilla.",
        "La postura detectada no es suficientemente vertical. Evita vídeos de flexiones, hip thrust o ejercicios en el suelo.",
      ],
    };
  }

  if (rangoRodilla < 25 || rangoCaderaNormalizado < 0.06) {
    return {
      puntuacion: 20,
      estado: "no_evaluable",
      mensajes: [
        "No se aprecia una repetición clara de sentadilla.",
        "Debe verse una bajada y subida de cadera con flexión evidente de rodilla.",
      ],
    };
  }

  const mensajes: string[] = [];
  let puntuacion = 100;
  let limiteMaximo = 100;

  if (anguloRodillaMinimo > 130) {
    puntuacion -= 45;
    limiteMaximo = Math.min(limiteMaximo, 50);
    mensajes.push(
      "La sentadilla parece muy parcial: apenas se detecta flexión profunda de rodilla.",
    );
  } else if (anguloRodillaMinimo > 110) {
    puntuacion -= 30;
    limiteMaximo = Math.min(limiteMaximo, 65);
    mensajes.push(
      "La profundidad parece insuficiente. Intenta bajar más si no hay molestias.",
    );
  } else if (anguloRodillaMinimo < 55) {
    puntuacion -= 10;
    mensajes.push(
      "La profundidad es alta. Asegúrate de mantener control y no perder estabilidad al final del recorrido.",
    );
  } else {
    mensajes.push("La profundidad general de la sentadilla parece adecuada.");
  }

  if (anguloRodillaMaximo < 145) {
    puntuacion -= 15;
    mensajes.push(
      "No parece haber una extensión clara al terminar la repetición. Finaliza más erguido entre repeticiones.",
    );
  }

  if (anguloCaderaMinimo < 35) {
    puntuacion -= 30;
    limiteMaximo = Math.min(limiteMaximo, 55);
    mensajes.push(
      "Se detecta una inclinación excesiva del tronco. Mantén el pecho más estable durante la bajada.",
    );
  } else if (anguloCaderaMinimo < 50) {
    puntuacion -= 15;
    limiteMaximo = Math.min(limiteMaximo, 75);
    mensajes.push(
      "El tronco se inclina de forma apreciable. Intenta controlar mejor la postura.",
    );
  } else {
    mensajes.push("La posición del tronco parece razonablemente estable.");
  }

  if (rangoCaderaNormalizado < 0.1) {
    puntuacion -= 20;
    limiteMaximo = Math.min(limiteMaximo, 65);
    mensajes.push(
      "El recorrido vertical de la cadera parece corto. Realiza una repetición más completa.",
    );
  }

  if (framesValidos.length < 10) {
    puntuacion -= 5;
    mensajes.push(
      "El vídeo contiene pocos frames evaluables. Interpreta el resultado como orientación.",
    );
  }

  const puntuacionFinal = limitarPuntuacion(Math.min(puntuacion, limiteMaximo));

  return {
    puntuacion: puntuacionFinal,
    estado: obtenerEstadoPorPuntuacion(puntuacionFinal),
    mensajes,
  };
}