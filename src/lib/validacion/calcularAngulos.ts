import type { PuntoPose } from "@/tipos/validacionTecnica";

export function buscarPunto(
  puntos: PuntoPose[],
  nombre: string,
  confianzaMinima = 0.25
) {
  const punto = puntos.find((item) => item.name === nombre);

  if (!punto || (punto.score ?? 0) < confianzaMinima) {
    return null;
  }

  return punto;
}

export function calcularAngulo(
  puntoA: PuntoPose,
  puntoB: PuntoPose,
  puntoC: PuntoPose
) {
  const vectorAB = {
    x: puntoA.x - puntoB.x,
    y: puntoA.y - puntoB.y,
  };

  const vectorCB = {
    x: puntoC.x - puntoB.x,
    y: puntoC.y - puntoB.y,
  };

  const productoEscalar = vectorAB.x * vectorCB.x + vectorAB.y * vectorCB.y;

  const moduloAB = Math.sqrt(vectorAB.x ** 2 + vectorAB.y ** 2);
  const moduloCB = Math.sqrt(vectorCB.x ** 2 + vectorCB.y ** 2);

  if (moduloAB === 0 || moduloCB === 0) {
    return null;
  }

  const coseno = productoEscalar / (moduloAB * moduloCB);
  const cosenoLimitado = Math.max(-1, Math.min(1, coseno));

  return Math.round((Math.acos(cosenoLimitado) * 180) / Math.PI);
}

export function calcularDistancia(puntoA: PuntoPose, puntoB: PuntoPose) {
  return Math.sqrt((puntoA.x - puntoB.x) ** 2 + (puntoA.y - puntoB.y) ** 2);
}

export function obtenerPuntosPrincipales(puntos: PuntoPose[]) {
  return {
    hombroIzquierdo: buscarPunto(puntos, "left_shoulder"),
    hombroDerecho: buscarPunto(puntos, "right_shoulder"),
    caderaIzquierda: buscarPunto(puntos, "left_hip"),
    caderaDerecha: buscarPunto(puntos, "right_hip"),
    rodillaIzquierda: buscarPunto(puntos, "left_knee"),
    rodillaDerecha: buscarPunto(puntos, "right_knee"),
    tobilloIzquierdo: buscarPunto(puntos, "left_ankle"),
    tobilloDerecho: buscarPunto(puntos, "right_ankle"),
    codoIzquierdo: buscarPunto(puntos, "left_elbow"),
    codoDerecho: buscarPunto(puntos, "right_elbow"),
    munecaIzquierda: buscarPunto(puntos, "left_wrist"),
    munecaDerecha: buscarPunto(puntos, "right_wrist"),
  };
}

type PuntosLado = {
  hombro: PuntoPose;
  codo: PuntoPose | null;
  muneca: PuntoPose | null;
  cadera: PuntoPose;
  rodilla: PuntoPose | null;
  tobillo: PuntoPose;
};

function contarPuntosValidos(puntos: Array<PuntoPose | null>) {
  return puntos.filter(Boolean).length;
}

export function obtenerPuntosLadoPreferente(puntos: PuntoPose[]): PuntosLado | null {
  const principales = obtenerPuntosPrincipales(puntos);

  const ladoIzquierdo = [
    principales.hombroIzquierdo,
    principales.codoIzquierdo,
    principales.munecaIzquierda,
    principales.caderaIzquierda,
    principales.rodillaIzquierda,
    principales.tobilloIzquierdo,
  ];

  const ladoDerecho = [
    principales.hombroDerecho,
    principales.codoDerecho,
    principales.munecaDerecha,
    principales.caderaDerecha,
    principales.rodillaDerecha,
    principales.tobilloDerecho,
  ];

  const usarIzquierdo =
    contarPuntosValidos(ladoIzquierdo) >= contarPuntosValidos(ladoDerecho);

  if (usarIzquierdo) {
    if (
      !principales.hombroIzquierdo ||
      !principales.caderaIzquierda ||
      !principales.tobilloIzquierdo
    ) {
      return null;
    }

    return {
      hombro: principales.hombroIzquierdo,
      codo: principales.codoIzquierdo,
      muneca: principales.munecaIzquierda,
      cadera: principales.caderaIzquierda,
      rodilla: principales.rodillaIzquierda,
      tobillo: principales.tobilloIzquierdo,
    };
  }

  if (
    !principales.hombroDerecho ||
    !principales.caderaDerecha ||
    !principales.tobilloDerecho
  ) {
    return null;
  }

  return {
    hombro: principales.hombroDerecho,
    codo: principales.codoDerecho,
    muneca: principales.munecaDerecha,
    cadera: principales.caderaDerecha,
    rodilla: principales.rodillaDerecha,
    tobillo: principales.tobilloDerecho,
  };
}

export function media(valores: number[]) {
  if (valores.length === 0) {
    return 0;
  }

  return valores.reduce((total, valor) => total + valor, 0) / valores.length;
}

export function obtenerRango(valores: number[]) {
  if (valores.length === 0) {
    return 0;
  }

  return Math.max(...valores) - Math.min(...valores);
}

export function limitarPuntuacion(valor: number) {
  return Math.max(0, Math.min(100, Math.round(valor)));
}

export function obtenerEstadoPorPuntuacion(puntuacion: number) {
  if (puntuacion >= 85) {
    return "correcto" as const;
  }

  if (puntuacion >= 65) {
    return "aceptable" as const;
  }

  return "mejorable" as const;
}