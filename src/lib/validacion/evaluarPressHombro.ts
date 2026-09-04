import type {
  PuntoPose,
  ResultadoEvaluadorTecnica,
} from "@/tipos/validacionTecnica";
import {
  buscarPunto,
  calcularAngulo,
  calcularDistancia,
  limitarPuntuacion,
  obtenerEstadoPorPuntuacion,
} from "@/lib/validacion/calcularAngulos";

type LadoPress = "izquierdo" | "derecho";

type FrameBrazoPress = {
  lado: LadoPress;
  anguloCodo: number;
  munecaAlturaRelativa: number;
  munecaXRelativa: number;
  codoXRelativo: number;
  separacionMunecaCodo: number;
};

type BrazoPressAnalizado = {
  lado: LadoPress;
  frames: FrameBrazoPress[];
  anguloCodoMaximo: number;
  anguloCodoMinimo: number;
  rangoMunecaVertical: number;
  alturaMaximaMuneca: number;
  alturaMinimaMuneca: number;
  desplazamientoHorizontalMuneca: number;
  separacionMunecaCodoMedia: number;
};

function obtenerRango(valores: number[]) {
  if (valores.length === 0) {
    return 0;
  }

  return Math.max(...valores) - Math.min(...valores);
}

function obtenerMedia(valores: number[]) {
  if (valores.length === 0) {
    return 0;
  }

  return valores.reduce((total, valor) => total + valor, 0) / valores.length;
}

function analizarBrazoPress(
  puntos: PuntoPose[],
  lado: LadoPress,
): FrameBrazoPress | null {
  const prefijo = lado === "izquierdo" ? "left" : "right";

  const hombro = buscarPunto(puntos, `${prefijo}_shoulder`, 0.2);
  const codo = buscarPunto(puntos, `${prefijo}_elbow`, 0.2);
  const muneca = buscarPunto(puntos, `${prefijo}_wrist`, 0.2);
  const cadera = buscarPunto(puntos, `${prefijo}_hip`, 0.2);

  if (!hombro || !codo || !muneca) {
    return null;
  }

  const anguloCodo = calcularAngulo(hombro, codo, muneca);

  if (anguloCodo === null) {
    return null;
  }

  const escalaTorso = cadera
    ? calcularDistancia(hombro, cadera)
    : calcularDistancia(hombro, codo) * 2;

  const escala = Math.max(1, escalaTorso);

  return {
    lado,
    anguloCodo,
    munecaAlturaRelativa: (hombro.y - muneca.y) / escala,
    munecaXRelativa: (muneca.x - hombro.x) / escala,
    codoXRelativo: (codo.x - hombro.x) / escala,
    separacionMunecaCodo: Math.abs(muneca.x - codo.x) / escala,
  };
}

function analizarMovimientoBrazoPress(
  frames: PuntoPose[][],
  lado: LadoPress,
): BrazoPressAnalizado | null {
  const framesBrazo = frames
    .map((frame) => analizarBrazoPress(frame, lado))
    .filter((frame): frame is FrameBrazoPress => Boolean(frame));

  if (framesBrazo.length < 5) {
    return null;
  }

  const angulosCodo = framesBrazo.map((frame) => frame.anguloCodo);
  const alturasMuneca = framesBrazo.map((frame) => frame.munecaAlturaRelativa);
  const posicionesMunecaX = framesBrazo.map((frame) => frame.munecaXRelativa);
  const separacionesMunecaCodo = framesBrazo.map(
    (frame) => frame.separacionMunecaCodo,
  );

  return {
    lado,
    frames: framesBrazo,
    anguloCodoMaximo: Math.max(...angulosCodo),
    anguloCodoMinimo: Math.min(...angulosCodo),
    rangoMunecaVertical: obtenerRango(alturasMuneca),
    alturaMaximaMuneca: Math.max(...alturasMuneca),
    alturaMinimaMuneca: Math.min(...alturasMuneca),
    desplazamientoHorizontalMuneca: obtenerRango(posicionesMunecaX),
    separacionMunecaCodoMedia: obtenerMedia(separacionesMunecaCodo),
  };
}

function elegirBrazoPrincipal(brazos: BrazoPressAnalizado[]) {
  return [...brazos].sort((a, b) => {
    const calidadA =
      a.frames.length + a.rangoMunecaVertical * 20 + a.anguloCodoMaximo / 10;
    const calidadB =
      b.frames.length + b.rangoMunecaVertical * 20 + b.anguloCodoMaximo / 10;

    return calidadB - calidadA;
  })[0];
}

export function evaluarPressHombro(
  frames: PuntoPose[][],
): ResultadoEvaluadorTecnica {
  const brazos = [
    analizarMovimientoBrazoPress(frames, "izquierdo"),
    analizarMovimientoBrazoPress(frames, "derecho"),
  ].filter((brazo): brazo is BrazoPressAnalizado => Boolean(brazo));

  if (brazos.length === 0) {
    return {
      puntuacion: 0,
      estado: "no_evaluable",
      mensajes: [
        "No se han detectado suficientes puntos para evaluar el press de hombro.",
        "Graba de frente o ligeramente lateral, con hombros, codos y muñecas visibles.",
      ],
    };
  }

  const brazo = elegirBrazoPrincipal(brazos);

  const movimientoVerticalClaro = brazo.rangoMunecaVertical >= 0.25;
  const llegaPorEncimaDelHombro = brazo.alturaMaximaMuneca >= 0.35;

  if (!movimientoVerticalClaro || !llegaPorEncimaDelHombro) {
    return {
      puntuacion: 10,
      estado: "no_evaluable",
      mensajes: [
        "El vídeo no parece corresponder claramente a un press de hombro.",
        "Debe apreciarse que las manos suben por encima de los hombros con un recorrido vertical claro.",
      ],
    };
  }

  const mensajes: string[] = [];
  let puntuacion = 100;
  let limiteMaximo = 100;

  if (brazo.anguloCodoMaximo < 135) {
    puntuacion -= 40;
    limiteMaximo = Math.min(limiteMaximo, 55);
    mensajes.push(
      "La extensión final del brazo parece claramente incompleta. Intenta terminar el press con los brazos más extendidos.",
    );
  } else if (brazo.anguloCodoMaximo < 155) {
    puntuacion -= 22;
    limiteMaximo = Math.min(limiteMaximo, 78);
    mensajes.push(
      "La extensión final del brazo podría ser mejor. El press no llega a una posición final completamente sólida.",
    );
  } else {
    mensajes.push("La extensión final del press parece adecuada.");
  }

  if (brazo.anguloCodoMinimo > 125) {
    puntuacion -= 30;
    limiteMaximo = Math.min(limiteMaximo, 65);
    mensajes.push(
      "La fase baja parece demasiado corta. Baja las manos de forma controlada hasta una posición más cercana al hombro.",
    );
  } else if (brazo.anguloCodoMinimo > 105) {
    puntuacion -= 15;
    limiteMaximo = Math.min(limiteMaximo, 82);
    mensajes.push(
      "La fase baja podría ser algo más completa. El recorrido empieza un poco alto.",
    );
  } else {
    mensajes.push("La fase baja del press parece suficientemente profunda.");
  }

  if (brazo.rangoMunecaVertical < 0.38) {
    puntuacion -= 28;
    limiteMaximo = Math.min(limiteMaximo, 68);
    mensajes.push(
      "Se detecta poco recorrido vertical de las manos. El movimiento parece algo limitado.",
    );
  } else if (brazo.rangoMunecaVertical < 0.55) {
    puntuacion -= 12;
    limiteMaximo = Math.min(limiteMaximo, 88);
    mensajes.push(
      "El recorrido vertical es válido, aunque podría ser más amplio.",
    );
  } else {
    mensajes.push("El recorrido vertical de las manos parece suficiente.");
  }

  if (brazo.alturaMaximaMuneca < 0.55) {
    puntuacion -= 20;
    limiteMaximo = Math.min(limiteMaximo, 75);
    mensajes.push(
      "La mano no parece llegar suficientemente alta por encima del hombro. Busca una extensión más clara arriba.",
    );
  }

  if (brazo.alturaMinimaMuneca > 0.18) {
    puntuacion -= 18;
    limiteMaximo = Math.min(limiteMaximo, 82);
    mensajes.push(
      "El movimiento empieza demasiado arriba. Esto puede indicar un press parcial o demasiado corto.",
    );
  }

  if (brazo.desplazamientoHorizontalMuneca > 0.45) {
    puntuacion -= 22;
    limiteMaximo = Math.min(limiteMaximo, 78);
    mensajes.push(
      "La trayectoria de la mano se desplaza bastante hacia delante o hacia atrás. Intenta empujar de forma más vertical.",
    );
  } else if (brazo.desplazamientoHorizontalMuneca > 0.3) {
    puntuacion -= 10;
    limiteMaximo = Math.min(limiteMaximo, 90);
    mensajes.push(
      "Hay algo de desplazamiento horizontal de la mano. Procura una trayectoria más vertical.",
    );
  } else {
    mensajes.push("La trayectoria de la mano parece bastante vertical.");
  }

  if (brazo.separacionMunecaCodoMedia > 0.45) {
    puntuacion -= 15;
    limiteMaximo = Math.min(limiteMaximo, 82);
    mensajes.push(
      "La muñeca y el codo no parecen alinearse bien durante parte del movimiento. Intenta mantener el antebrazo más vertical.",
    );
  }

  if (brazos.length === 2) {
    const otroBrazo = brazos.find((item) => item.lado !== brazo.lado);

    if (otroBrazo) {
      const diferenciaExtension = Math.abs(
        brazo.anguloCodoMaximo - otroBrazo.anguloCodoMaximo,
      );

      const diferenciaRecorrido = Math.abs(
        brazo.rangoMunecaVertical - otroBrazo.rangoMunecaVertical,
      );

      if (diferenciaExtension > 25 || diferenciaRecorrido > 0.25) {
        puntuacion -= 12;
        limiteMaximo = Math.min(limiteMaximo, 88);
        mensajes.push(
          "Se aprecia cierta asimetría entre brazos. Intenta subir ambos de forma más equilibrada.",
        );
      }
    }
  }

  if (brazo.frames.length < 10) {
    puntuacion -= 5;
    mensajes.push(
      "El vídeo contiene pocos frames evaluables. El resultado debe interpretarse como orientación.",
    );
  }

  const puntuacionFinal = limitarPuntuacion(Math.min(puntuacion, limiteMaximo));

  return {
    puntuacion: puntuacionFinal,
    estado: obtenerEstadoPorPuntuacion(puntuacionFinal),
    mensajes,
  };
}