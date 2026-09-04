import type {
  EjercicioValidable,
  ResultadoValidacionTecnica,
  PuntoPose,
} from "@/tipos/validacionTecnica";
import { evaluarSentadilla } from "@/lib/validacion/evaluarSentadilla";
import { evaluarFlexiones } from "@/lib/validacion/evaluarFlexiones";
import { evaluarHipThrust } from "@/lib/validacion/evaluarHipThrust";
import { evaluarPressHombro } from "@/lib/validacion/evaluarPressHombro";
import { evaluarCurlBiceps } from "@/lib/validacion/evaluarCurlBiceps";

export function evaluarTecnica(
  ejercicio: EjercicioValidable,
  frames: PuntoPose[][],
): ResultadoValidacionTecnica {
  if (frames.length === 0) {
    return {
      ejercicio,
      puntuacion: 0,
      estado: "no_evaluable",
      mensajes: [
        "No se ha podido detectar postura en el vídeo.",
        "Prueba con buena iluminación, cámara fija y cuerpo completo visible.",
      ],
      framesAnalizados: 0,
    };
  }

  const evaluadores = {
    sentadilla: evaluarSentadilla,
    flexiones: evaluarFlexiones,
    hip_thrust: evaluarHipThrust,
    press_hombro: evaluarPressHombro,
    curl_biceps: evaluarCurlBiceps,
  };

  const resultado = evaluadores[ejercicio](frames);

  return {
    ejercicio,
    puntuacion: resultado.puntuacion,
    estado: resultado.estado,
    mensajes: resultado.mensajes,
    framesAnalizados: frames.length,
  };
}