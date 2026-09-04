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

type FrameHipThrust = {
  anguloCadera: number;
  anguloRodilla: number;
  horizontalidadTroncoMuslo: number;
  alturaCadera: number;
  escalaCuerpo: number;
};

function analizarFrameHipThrust(puntos: PuntoPose[]): FrameHipThrust | null {
  const lado = obtenerPuntosLadoPreferente(puntos);

  if (!lado || !lado.rodilla) {
    return null;
  }

  const anguloCadera = calcularAngulo(lado.hombro, lado.cadera, lado.rodilla);
  const anguloRodilla = calcularAngulo(lado.cadera, lado.rodilla, lado.tobillo);

  if (anguloCadera === null || anguloRodilla === null) {
    return null;
  }

  const distanciaHorizontal = Math.abs(lado.rodilla.x - lado.hombro.x);
  const distanciaVertical = Math.abs(lado.rodilla.y - lado.hombro.y);
  const horizontalidadTroncoMuslo = distanciaHorizontal / Math.max(1, distanciaVertical);

  return {
    anguloCadera,
    anguloRodilla,
    horizontalidadTroncoMuslo,
    alturaCadera: lado.cadera.y,
    escalaCuerpo: calcularDistancia(lado.hombro, lado.tobillo),
  };
}

export function evaluarHipThrust(
  frames: PuntoPose[][],
): ResultadoEvaluadorTecnica {
  const framesValidos = frames
    .map((frame) => analizarFrameHipThrust(frame))
    .filter((frame): frame is FrameHipThrust => Boolean(frame));

  if (framesValidos.length < 6) {
    return {
      puntuacion: 0,
      estado: "no_evaluable",
      mensajes: [
        "No se han detectado suficientes puntos corporales para evaluar el hip thrust.",
        "Graba de lado, mostrando hombro, cadera, rodilla y tobillo.",
      ],
    };
  }

  const angulosCadera = framesValidos.map((frame) => frame.anguloCadera);
  const angulosRodilla = framesValidos.map((frame) => frame.anguloRodilla);
  const alturasCadera = framesValidos.map((frame) => frame.alturaCadera);
  const horizontalidades = framesValidos.map(
    (frame) => frame.horizontalidadTroncoMuslo,
  );

  const anguloCaderaMaximo = Math.max(...angulosCadera);
  const anguloCaderaMinimo = Math.min(...angulosCadera);
  const rangoAnguloCadera = obtenerRango(angulosCadera);
  const anguloRodillaMedio = media(angulosRodilla);
  const anguloRodillaMinimo = Math.min(...angulosRodilla);
  const anguloRodillaMaximo = Math.max(...angulosRodilla);
  const horizontalidadMedia = media(horizontalidades);

  const escalaCuerpo = media(framesValidos.map((frame) => frame.escalaCuerpo));
  const rangoCaderaNormalizado = obtenerRango(alturasCadera) / Math.max(1, escalaCuerpo);

  const proporcionRodillaFlexionada =
    framesValidos.filter(
      (frame) => frame.anguloRodilla >= 60 && frame.anguloRodilla <= 135,
    ).length / framesValidos.length;

  const proporcionPosturaHipThrust =
    framesValidos.filter(
      (frame) =>
        frame.horizontalidadTroncoMuslo >= 0.65 &&
        frame.anguloRodilla >= 60 &&
        frame.anguloRodilla <= 135,
    ).length / framesValidos.length;

  if (
    proporcionRodillaFlexionada < 0.5 ||
    proporcionPosturaHipThrust < 0.45 ||
    anguloRodillaMedio > 145
  ) {
    return {
      puntuacion: 10,
      estado: "no_evaluable",
      mensajes: [
        "El vídeo no parece corresponder a un hip thrust.",
        "Debe verse una rodilla flexionada y una extensión de cadera desde una posición apoyada.",
        "Si el cuerpo aparece en plancha o con piernas extendidas, probablemente sea otro ejercicio.",
      ],
    };
  }

  if (rangoAnguloCadera < 18 || rangoCaderaNormalizado < 0.04) {
    return {
      puntuacion: 20,
      estado: "no_evaluable",
      mensajes: [
        "No se aprecia una repetición clara de hip thrust.",
        "Debe verse una subida y bajada clara de la cadera.",
      ],
    };
  }

  const mensajes: string[] = [];
  let puntuacion = 100;
  let limiteMaximo = 100;

  if (anguloCaderaMaximo < 150) {
    puntuacion -= 35;
    limiteMaximo = Math.min(limiteMaximo, 60);
    mensajes.push(
      "La extensión final de cadera parece incompleta. Intenta terminar con la cadera más alta y el tronco estable.",
    );
  } else {
    mensajes.push("La extensión final de cadera parece adecuada.");
  }

  if (anguloCaderaMinimo > 125) {
    puntuacion -= 20;
    limiteMaximo = Math.min(limiteMaximo, 70);
    mensajes.push(
      "La bajada parece corta. Realiza una fase descendente más clara antes de extender la cadera.",
    );
  }

  if (rangoCaderaNormalizado < 0.08) {
    puntuacion -= 25;
    limiteMaximo = Math.min(limiteMaximo, 60);
    mensajes.push(
      "El recorrido vertical de la cadera parece limitado.",
    );
  } else {
    mensajes.push("El recorrido vertical de la cadera parece suficiente.");
  }

  if (anguloRodillaMinimo < 55 || anguloRodillaMaximo > 145) {
    puntuacion -= 20;
    limiteMaximo = Math.min(limiteMaximo, 70);
    mensajes.push(
      "La posición de las rodillas no parece estable. Mantén los pies apoyados y las rodillas flexionadas.",
    );
  }

  if (horizontalidadMedia < 0.65) {
    puntuacion -= 15;
    mensajes.push(
      "El encuadre lateral no es claro. Graba desde un lado para ver bien hombro, cadera y rodilla.",
    );
  }

  const puntuacionFinal = limitarPuntuacion(Math.min(puntuacion, limiteMaximo));

  return {
    puntuacion: puntuacionFinal,
    estado: obtenerEstadoPorPuntuacion(puntuacionFinal),
    mensajes,
  };
}