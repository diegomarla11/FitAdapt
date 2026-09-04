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

type BrazoFrame = {
  lado: "izquierdo" | "derecho";
  anguloCodo: number;
  posicionCodoX: number;
  posicionCodoY: number;
  anguloBrazoSuperior: number;
  posicionMunecaY: number;
};

type BrazoAnalizado = {
  lado: "izquierdo" | "derecho";
  frames: BrazoFrame[];
  anguloMinimo: number;
  anguloMaximo: number;
  rangoCodo: number;
  rangoCodoX: number;
  rangoCodoY: number;
  desplazamientoCodo: number;
  rangoBrazoSuperior: number;
  recorridoMuneca: number;
};

function obtenerRango(valores: number[]) {
  if (valores.length === 0) {
    return 0;
  }

  return Math.max(...valores) - Math.min(...valores);
}

function calcularAnguloRespectoVertical(hombro: PuntoPose, codo: PuntoPose) {
  const dx = codo.x - hombro.x;
  const dy = codo.y - hombro.y;

  return Math.abs((Math.atan2(dx, dy) * 180) / Math.PI);
}

function analizarBrazo(
  puntos: PuntoPose[],
  lado: "izquierdo" | "derecho",
): BrazoFrame | null {
  const prefijo = lado === "izquierdo" ? "left" : "right";

  const hombro = buscarPunto(puntos, `${prefijo}_shoulder`, 0.2);
  const codo = buscarPunto(puntos, `${prefijo}_elbow`, 0.2);
  const muneca = buscarPunto(puntos, `${prefijo}_wrist`, 0.2);

  if (!hombro || !codo || !muneca) {
    return null;
  }

  const anguloCodo = calcularAngulo(hombro, codo, muneca);

  if (anguloCodo === null) {
    return null;
  }

  const longitudBrazoSuperior = calcularDistancia(hombro, codo);
  const longitudAntebrazo = calcularDistancia(codo, muneca);
  const escalaBrazo = Math.max(1, longitudBrazoSuperior + longitudAntebrazo);

  return {
    lado,
    anguloCodo,
    posicionCodoX: (codo.x - hombro.x) / escalaBrazo,
    posicionCodoY: (codo.y - hombro.y) / escalaBrazo,
    anguloBrazoSuperior: calcularAnguloRespectoVertical(hombro, codo),
    posicionMunecaY: (muneca.y - hombro.y) / escalaBrazo,
  };
}

function analizarMovimientoBrazo(
  frames: PuntoPose[][],
  lado: "izquierdo" | "derecho",
): BrazoAnalizado | null {
  const framesBrazo = frames
    .map((frame) => analizarBrazo(frame, lado))
    .filter((frame): frame is BrazoFrame => Boolean(frame));

  if (framesBrazo.length < 5) {
    return null;
  }

  const angulosCodo = framesBrazo.map((frame) => frame.anguloCodo);
  const posicionesCodoX = framesBrazo.map((frame) => frame.posicionCodoX);
  const posicionesCodoY = framesBrazo.map((frame) => frame.posicionCodoY);
  const angulosBrazoSuperior = framesBrazo.map(
    (frame) => frame.anguloBrazoSuperior,
  );
  const posicionesMunecaY = framesBrazo.map((frame) => frame.posicionMunecaY);

  const rangoCodoX = obtenerRango(posicionesCodoX);
  const rangoCodoY = obtenerRango(posicionesCodoY);

  return {
    lado,
    frames: framesBrazo,
    anguloMinimo: Math.min(...angulosCodo),
    anguloMaximo: Math.max(...angulosCodo),
    rangoCodo: obtenerRango(angulosCodo),
    rangoCodoX,
    rangoCodoY,
    desplazamientoCodo: Math.sqrt(rangoCodoX ** 2 + rangoCodoY ** 2),
    rangoBrazoSuperior: obtenerRango(angulosBrazoSuperior),
    recorridoMuneca: obtenerRango(posicionesMunecaY),
  };
}

function elegirBrazoPrincipal(brazos: BrazoAnalizado[]) {
  return [...brazos].sort((a, b) => {
    const movimientoA = a.rangoCodo + a.recorridoMuneca * 100;
    const movimientoB = b.rangoCodo + b.recorridoMuneca * 100;

    return movimientoB - movimientoA;
  })[0];
}

export function evaluarCurlBiceps(
  frames: PuntoPose[][],
): ResultadoEvaluadorTecnica {
  const brazos = [
    analizarMovimientoBrazo(frames, "izquierdo"),
    analizarMovimientoBrazo(frames, "derecho"),
  ].filter((brazo): brazo is BrazoAnalizado => Boolean(brazo));

  if (brazos.length === 0) {
    return {
      puntuacion: 0,
      estado: "no_evaluable",
      mensajes: [
        "No se han detectado suficientes puntos del brazo para evaluar el curl de bíceps.",
        "Prueba con un vídeo donde se vea claramente hombro, codo y muñeca durante todo el movimiento.",
      ],
    };
  }

  const brazo = elegirBrazoPrincipal(brazos);

  const mensajes: string[] = [];
  let puntuacion = 100;
  let limiteMaximo = 100;

  if (brazo.rangoCodo < 30 || brazo.recorridoMuneca < 0.12) {
    puntuacion -= 45;
    limiteMaximo = Math.min(limiteMaximo, 55);
    mensajes.push(
      "El movimiento del curl parece demasiado corto. No se aprecia suficiente recorrido del codo y de la muñeca.",
    );
  } else if (brazo.rangoCodo < 50) {
    puntuacion -= 25;
    limiteMaximo = Math.min(limiteMaximo, 78);
    mensajes.push(
      "El recorrido del codo podría ser mayor para completar mejor el curl.",
    );
  } else {
    mensajes.push("El rango de movimiento del codo parece adecuado.");
  }

  if (brazo.anguloMinimo > 95) {
    puntuacion -= 18;
    limiteMaximo = Math.min(limiteMaximo, 78);
    mensajes.push(
      "La fase final del curl parece incompleta. Intenta flexionar algo más el codo sin adelantar el brazo.",
    );
  }

  if (brazo.anguloMaximo < 125) {
    puntuacion -= 15;
    limiteMaximo = Math.min(limiteMaximo, 82);
    mensajes.push(
      "La fase baja parece incompleta. Controla la bajada y extiende algo más el codo.",
    );
  }

  if (brazo.rangoBrazoSuperior > 45) {
    puntuacion -= 35;
    limiteMaximo = Math.min(limiteMaximo, 60);
    mensajes.push(
      "Se aprecia demasiado balanceo del brazo superior. El hombro participa demasiado y el curl pierde aislamiento.",
    );
  } else if (brazo.rangoBrazoSuperior > 30) {
    puntuacion -= 22;
    limiteMaximo = Math.min(limiteMaximo, 75);
    mensajes.push(
      "El brazo superior se mueve bastante. Intenta mantener el codo más fijo y mover principalmente el antebrazo.",
    );
  } else if (brazo.rangoBrazoSuperior > 18) {
    puntuacion -= 8;
    limiteMaximo = Math.min(limiteMaximo, 90);
    mensajes.push(
      "Hay un pequeño movimiento del brazo superior, aceptable en un curl libre si no se usa impulso excesivo.",
    );
  } else {
    mensajes.push("El brazo superior parece suficientemente estable.");
  }

  if (brazo.desplazamientoCodo > 0.55) {
    puntuacion -= 30;
    limiteMaximo = Math.min(limiteMaximo, 65);
    mensajes.push(
      "El codo se desplaza demasiado durante el recorrido. Intenta mantenerlo cerca del torso.",
    );
  } else if (brazo.desplazamientoCodo > 0.38) {
    puntuacion -= 15;
    limiteMaximo = Math.min(limiteMaximo, 82);
    mensajes.push(
      "El codo se desplaza algo durante el curl. No es grave, pero conviene reducirlo para aislar mejor el bíceps.",
    );
  } else {
    mensajes.push("El desplazamiento del codo parece controlado.");
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