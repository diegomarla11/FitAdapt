import { obtenerUltimoPerfil } from "@/lib/rutina/obtenerUltimaRutina";
import { obtenerUltimaRutinaGuardada } from "@/lib/rutina/obtenerUltimaRutina";
import { obtenerDatosProgreso } from "@/lib/progreso/obtenerDatosProgreso";

export async function obtenerResumenInicio() {
  const [perfil, rutinaGuardada, datosProgreso] = await Promise.all([
    obtenerUltimoPerfil(),
    obtenerUltimaRutinaGuardada(),
    obtenerDatosProgreso(),
  ]);

  return {
    perfil,
    rutinaGuardada,
    progreso: datosProgreso.resumenGlobal,
    ultimasSesiones: datosProgreso.ultimasSesiones,
  };
}