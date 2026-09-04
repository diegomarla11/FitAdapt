"use client";

import { useEffect, useMemo, useState } from "react";
import { guardarSesionEntrenamientoAction } from "@/app/entrenamiento/acciones";
import { calcularResumenSesion } from "@/lib/dominio/progresion/calcularResumenSesion";
import { validarRepeticionesReales } from "@/lib/entrenamiento/validarRepeticionesReales";
import TarjetaSugerenciaEjercicio from "@/componentes/tarjetaSugerenciaEjercicio";
import { calcularDescansoRecomendado } from "@/lib/entrenamiento/calcularDescansoRecomendado";
import { estilos, unirClases } from "@/lib/ui/estilos";

import type {
  DatosReales,
  DiaEntrenamiento,
  SesionGuardada,
} from "@/tipos/entrenamiento";

type Props = {
  rutinaId: string | null;
  dias: DiaEntrenamiento[];
  sesionesGuardadas: SesionGuardada[];
};

function obtenerEtiquetaEstado(estado: string | undefined) {
  if (estado === "parcial") return "Hice menos";
  if (estado === "superado") return "Hice más";
  return "Hecho";
}

function formatearSensacionCorta(sensacion: string | undefined) {
  if (sensacion === "facil") return "Fácil";
  if (sensacion === "dificil") return "Difícil";
  if (sensacion === "bien") return "Bien";
  return "Sin indicar";
}

function obtenerClasesEstado(estado: string | undefined, completado: boolean) {
  if (!completado) {
    return {
      tarjeta: "border-slate-200 bg-slate-50",
      badge: "border-slate-200 bg-white text-slate-600",
      texto: "Pendiente",
    };
  }

  if (estado === "parcial") {
    return {
      tarjeta: "border-amber-300 bg-amber-50",
      badge: "border-amber-300 bg-amber-100 text-amber-950",
      texto: "Hice menos",
    };
  }

  if (estado === "superado") {
    return {
      tarjeta: "border-blue-300 bg-blue-50",
      badge: "border-blue-300 bg-blue-100 text-blue-950",
      texto: "Hice más",
    };
  }

  return {
    tarjeta: "border-lime-200 bg-white",
    badge: "border-lime-300 bg-lime-100 text-lime-950",
    texto: "Hecho",
  };
}

function obtenerEstadoDolor(valor: string | undefined) {
  const numero = valor?.trim() !== "" ? Number(valor) : 0;

  if (!Number.isFinite(numero)) {
    return {
      texto: "Sin indicar",
      clase: "border-slate-200 bg-slate-50 text-slate-700",
    };
  }

  if (numero >= 7) {
    return {
      texto: `Dolor alto · ${numero}/10`,
      clase: "border-red-200 bg-red-50 text-red-900",
    };
  }

  if (numero >= 4) {
    return {
      texto: `Dolor moderado · ${numero}/10`,
      clase: "border-amber-200 bg-amber-50 text-amber-900",
    };
  }

  return {
    texto: `Dolor bajo · ${numero}/10`,
    clase: "border-lime-200 bg-lime-50 text-lime-900",
  };
}

function obtenerEstadoFatiga(valor: string | undefined) {
  const numero = valor?.trim() !== "" ? Number(valor) : 5;

  if (!Number.isFinite(numero)) {
    return {
      texto: "Sin indicar",
      clase: "border-slate-200 bg-slate-50 text-slate-700",
    };
  }

  if (numero >= 8) {
    return {
      texto: `Fatiga alta · ${numero}/10`,
      clase: "border-red-200 bg-red-50 text-red-900",
    };
  }

  if (numero >= 5) {
    return {
      texto: `Fatiga media · ${numero}/10`,
      clase: "border-amber-200 bg-amber-50 text-amber-900",
    };
  }

  return {
    texto: `Fatiga baja · ${numero}/10`,
    clase: "border-lime-200 bg-lime-50 text-lime-900",
  };
}

function formatearTiempo(segundos: number) {
  const minutos = Math.floor(segundos / 60);
  const restoSegundos = segundos % 60;

  return `${minutos}:${restoSegundos.toString().padStart(2, "0")}`;
}

function BadgeDato({ children }: { children: React.ReactNode }) {
  return <span className={estilos.badge.base}>{children}</span>;
}

function BotonEstado({
  activo,
  children,
  onClick,
  tipo,
}: {
  activo: boolean;
  children: React.ReactNode;
  onClick: () => void;
  tipo: "hecho" | "menos" | "mas" | "neutral";
}) {
  const claseActiva =
    tipo === "hecho"
      ? "border-slate-950 bg-slate-950 text-white"
      : tipo === "menos"
        ? "border-amber-300 bg-amber-200 text-amber-950"
        : tipo === "mas"
          ? "border-blue-300 bg-blue-200 text-blue-950"
          : "border-slate-300 bg-slate-950 text-white";

  return (
    <button
      type="button"
      onClick={onClick}
      className={unirClases(
        "rounded-2xl border px-4 py-3 text-sm font-black transition hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-lime-400/20",
        activo
          ? claseActiva
          : "border-slate-200 bg-white text-slate-700 hover:border-lime-300 hover:bg-lime-50",
      )}
    >
      {children}
    </button>
  );
}

function Campo({
  label,
  ayuda,
  children,
}: {
  label: string;
  ayuda?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block rounded-[1.25rem] border border-slate-200 bg-white p-4">
      <span className="mb-2 block text-sm font-bold text-slate-700">
        {label}
      </span>

      {children}

      {ayuda && (
        <span className="mt-2 block text-xs leading-5 text-slate-500">
          {ayuda}
        </span>
      )}
    </label>
  );
}

function crearDatosRealesPorDefecto(
  ejercicio: DiaEntrenamiento["ejercicios"][number],
) {
  return {
    estado: "completado",
    seriesReales:
      ejercicio.ultimoRegistro?.series_reales !== null &&
        ejercicio.ultimoRegistro?.series_reales !== undefined
        ? String(ejercicio.ultimoRegistro.series_reales)
        : String(ejercicio.series),
    repeticionesReales: "",
    pesoUsado:
      ejercicio.ultimoRegistro?.peso_usado !== null &&
        ejercicio.ultimoRegistro?.peso_usado !== undefined
        ? String(ejercicio.ultimoRegistro.peso_usado)
        : "",
    sensacion: ejercicio.ultimoRegistro?.sensacion ?? "bien",
    nivelDolor:
      ejercicio.ultimoRegistro?.nivel_dolor !== null &&
        ejercicio.ultimoRegistro?.nivel_dolor !== undefined
        ? String(ejercicio.ultimoRegistro.nivel_dolor)
        : "",
    fatiga:
      ejercicio.ultimoRegistro?.fatiga !== null &&
        ejercicio.ultimoRegistro?.fatiga !== undefined
        ? String(ejercicio.ultimoRegistro.fatiga)
        : "",
    descansoRecomendado: "",
    descansoReal: "",
    motivoParcial: "",
  };
}

function PanelMensaje({
  mensaje,
  tipo,
}: {
  mensaje: string;
  tipo: "ok" | "error" | "info";
}) {
  return (
    <div
      className={unirClases(
        "rounded-[1.5rem] border p-4 text-sm font-bold leading-6",
        tipo === "ok" && "border-lime-200 bg-lime-50 text-lime-900",
        tipo === "error" && "border-red-200 bg-red-50 text-red-900",
        tipo === "info" && "border-blue-200 bg-blue-50 text-blue-900",
      )}
    >
      {mensaje}
    </div>
  );
}


export default function EntrenamientoActual({
  rutinaId,
  dias,
  sesionesGuardadas,
}: Props) {
  const [diaSeleccionado, setDiaSeleccionado] = useState(dias[0]?.dia ?? 1);
  const [ejerciciosCompletados, setEjerciciosCompletados] = useState<string[]>(
    [],
  );
  const [datosReales, setDatosReales] = useState<DatosReales>({});
  const [guardandoSesion, setGuardandoSesion] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [notaSesion, setNotaSesion] = useState("");
  const [sesionesLocales, setSesionesLocales] =
    useState<SesionGuardada[]>(sesionesGuardadas);
  const [temporizadorEjercicioId, setTemporizadorEjercicioId] = useState<
    string | null
  >(null);
  const [segundosRestantes, setSegundosRestantes] = useState(0);
  const [temporizadorActivo, setTemporizadorActivo] = useState(false);

  const diaActual = useMemo(() => {
    return dias.find((dia) => dia.dia === diaSeleccionado);
  }, [dias, diaSeleccionado]);

  const sesionExistenteDia = useMemo(() => {
    return sesionesLocales.find((sesion) => sesion.dia === diaSeleccionado);
  }, [sesionesLocales, diaSeleccionado]);

  const resumenSesion = useMemo(() => {
    if (!diaActual) {
      return null;
    }

    const ejerciciosSeleccionados = diaActual.ejercicios
      .filter((ejercicio) => ejerciciosCompletados.includes(ejercicio.id))
      .map((ejercicio) => {
        const datosEjercicio = datosReales[ejercicio.id];

        const sensacion =
          datosEjercicio?.sensacion === "facil" ||
            datosEjercicio?.sensacion === "bien" ||
            datosEjercicio?.sensacion === "dificil"
            ? datosEjercicio.sensacion
            : "bien";

        return {
          seriesReales:
            datosEjercicio?.seriesReales?.trim() !== ""
              ? Number(datosEjercicio.seriesReales)
              : ejercicio.series,
          pesoUsado:
            datosEjercicio?.pesoUsado?.trim() !== ""
              ? Number(datosEjercicio.pesoUsado)
              : null,
          sensacion,
        };
      });

    return calcularResumenSesion(ejerciciosSeleccionados);
  }, [diaActual, ejerciciosCompletados, datosReales]);

  const estadoSesionActual = useMemo(() => {
    if (!diaActual || !sesionExistenteDia) {
      return {
        ejerciciosCompletadosIniciales: [] as string[],
        datosRealesIniciales: {} as DatosReales,
        notaSesionInicial: "",
      };
    }

    const ejerciciosCompletadosIniciales = diaActual.ejercicios
      .filter((ejercicioPantalla) =>
        sesionExistenteDia.sesion_ejercicios.some((ejercicioSesion) => {
          if (!ejercicioSesion.completado) {
            return false;
          }

          if (ejercicioSesion.ejercicio_id) {
            return ejercicioSesion.ejercicio_id === ejercicioPantalla.id;
          }

          return ejercicioSesion.nombre_ejercicio === ejercicioPantalla.nombre;
        }),
      )
      .map((ejercicio) => ejercicio.id);

    const datosRealesIniciales: DatosReales = {};

    for (const ejercicioSesion of sesionExistenteDia.sesion_ejercicios) {
      const ejercicioPantalla = diaActual.ejercicios.find((ejercicio) => {
        if (ejercicioSesion.ejercicio_id) {
          return ejercicio.id === ejercicioSesion.ejercicio_id;
        }

        return ejercicio.nombre === ejercicioSesion.nombre_ejercicio;
      });

      if (ejercicioPantalla) {
        datosRealesIniciales[ejercicioPantalla.id] = {
          estado: ejercicioSesion.estado_resultado ?? "completado",
          seriesReales: ejercicioSesion.series_reales?.toString() ?? "",
          repeticionesReales: ejercicioSesion.repeticiones_reales ?? "",
          pesoUsado: ejercicioSesion.peso_usado?.toString() ?? "",
          sensacion: ejercicioSesion.sensacion ?? "",
          nivelDolor: ejercicioSesion.nivel_dolor?.toString() ?? "",
          fatiga: ejercicioSesion.fatiga?.toString() ?? "",
          descansoRecomendado:
            ejercicioSesion.descanso_recomendado?.toString() ?? "",
          descansoReal: ejercicioSesion.descanso_real?.toString() ?? "",
          motivoParcial: ejercicioSesion.motivo_parcial ?? "",
        };
      }
    }

    return {
      ejerciciosCompletadosIniciales,
      datosRealesIniciales,
      notaSesionInicial: sesionExistenteDia.nota_sesion ?? "",
    };
  }, [diaActual, sesionExistenteDia]);

  useEffect(() => {
    queueMicrotask(() => {
      setEjerciciosCompletados(
        estadoSesionActual.ejerciciosCompletadosIniciales,
      );
      setDatosReales(estadoSesionActual.datosRealesIniciales);
      setNotaSesion(estadoSesionActual.notaSesionInicial);
    });
  }, [estadoSesionActual]);

  useEffect(() => {
    if (!temporizadorActivo || segundosRestantes <= 0) {
      return;
    }

    const intervalo = window.setInterval(() => {
      setSegundosRestantes((actual) => {
        if (actual <= 1) {
          setTemporizadorActivo(false);
          return 0;
        }

        return actual - 1;
      });
    }, 1000);

    return () => {
      window.clearInterval(intervalo);
    };
  }, [temporizadorActivo, segundosRestantes]);

  function cambiarEstadoEjercicio(idEjercicio: string) {
    const yaEstaCompletado = ejerciciosCompletados.includes(idEjercicio);

    if (yaEstaCompletado) {
      setEjerciciosCompletados((actuales) =>
        actuales.filter((id) => id !== idEjercicio),
      );

      setDatosReales((actuales) => {
        const nuevosDatos = { ...actuales };
        delete nuevosDatos[idEjercicio];
        return nuevosDatos;
      });

      return;
    }

    const ejercicioActual = diaActual?.ejercicios.find(
      (ejercicio) => ejercicio.id === idEjercicio,
    );

    setEjerciciosCompletados((actuales) => [...actuales, idEjercicio]);

    if (!ejercicioActual) {
      return;
    }

    setDatosReales((actuales) => ({
      ...actuales,
      [idEjercicio]: {
        ...crearDatosRealesPorDefecto(ejercicioActual),
        ...actuales[idEjercicio],
        estado: actuales[idEjercicio]?.estado ?? "completado",
      },
    }));
  }

  function marcarTodosComoHechos() {
    if (!diaActual) {
      return;
    }

    setEjerciciosCompletados(diaActual.ejercicios.map((ejercicio) => ejercicio.id));

    setDatosReales((actuales) => {
      const nuevosDatos: DatosReales = { ...actuales };

      for (const ejercicio of diaActual.ejercicios) {
        nuevosDatos[ejercicio.id] = {
          ...crearDatosRealesPorDefecto(ejercicio),
          ...actuales[ejercicio.id],
          estado: actuales[ejercicio.id]?.estado ?? "completado",
        };
      }

      return nuevosDatos;
    });

    setMensaje(
      "Todos los ejercicios de la sesión se han marcado como hechos. Puedes editar solo los datos que quieras ajustar.",
    );
  }

  function desmarcarTodos() {
    if (!diaActual) {
      return;
    }

    const idsDiaActual = new Set(diaActual.ejercicios.map((ejercicio) => ejercicio.id));

    setEjerciciosCompletados((actuales) =>
      actuales.filter((id) => !idsDiaActual.has(id)),
    );

    setDatosReales((actuales) => {
      const nuevosDatos = { ...actuales };

      for (const id of idsDiaActual) {
        delete nuevosDatos[id];
      }

      return nuevosDatos;
    });

    finalizarTemporizador();
    setMensaje("Se han desmarcado todos los ejercicios de la sesión.");
  }

  function cambiarDatoReal(
    idEjercicio: string,
    campo:
      | "estado"
      | "seriesReales"
      | "repeticionesReales"
      | "pesoUsado"
      | "sensacion"
      | "nivelDolor"
      | "fatiga"
      | "descansoReal"
      | "motivoParcial",
    valor: string,
  ) {
    setDatosReales((actuales) => ({
      ...actuales,
      [idEjercicio]: {
        estado: actuales[idEjercicio]?.estado ?? "completado",
        seriesReales: actuales[idEjercicio]?.seriesReales ?? "",
        repeticionesReales: actuales[idEjercicio]?.repeticionesReales ?? "",
        pesoUsado: actuales[idEjercicio]?.pesoUsado ?? "",
        sensacion: actuales[idEjercicio]?.sensacion ?? "",
        nivelDolor: actuales[idEjercicio]?.nivelDolor ?? "",
        fatiga: actuales[idEjercicio]?.fatiga ?? "",
        descansoRecomendado: actuales[idEjercicio]?.descansoRecomendado ?? "",
        descansoReal: actuales[idEjercicio]?.descansoReal ?? "",
        motivoParcial: actuales[idEjercicio]?.motivoParcial ?? "",
        [campo]: valor,
      },
    }));
  }

  function iniciarTemporizador(idEjercicio: string, segundos: number) {
    setTemporizadorEjercicioId(idEjercicio);
    setSegundosRestantes(segundos);
    setTemporizadorActivo(true);
  }

  function pausarTemporizador() {
    setTemporizadorActivo(false);
  }

  function reanudarTemporizador() {
    if (segundosRestantes > 0) {
      setTemporizadorActivo(true);
    }
  }

  function reiniciarTemporizador(idEjercicio: string, segundos: number) {
    setTemporizadorEjercicioId(idEjercicio);
    setSegundosRestantes(segundos);
    setTemporizadorActivo(true);
  }

  function finalizarTemporizador() {
    setTemporizadorActivo(false);
    setSegundosRestantes(0);
    setTemporizadorEjercicioId(null);
  }

  async function guardarSesion() {
    if (!diaActual) {
      return;
    }

    try {
      setGuardandoSesion(true);
      setMensaje("");

      const ejerciciosSeleccionados = diaActual.ejercicios
        .filter((ejercicio) => ejerciciosCompletados.includes(ejercicio.id))
        .map((ejercicio) => {
          const datosEjercicio = datosReales[ejercicio.id];

          const seriesPlanificadas = ejercicio.series;
          const repeticionesPlanificadas = ejercicio.repeticiones;

          const seriesReales =
            datosEjercicio?.seriesReales?.trim() !== ""
              ? Number(datosEjercicio.seriesReales)
              : seriesPlanificadas;

          const repeticionesReales =
            datosEjercicio?.repeticionesReales?.trim() !== ""
              ? datosEjercicio.repeticionesReales.trim()
              : "";

          const pesoUsado =
            datosEjercicio?.pesoUsado?.trim() !== ""
              ? Number(datosEjercicio.pesoUsado)
              : null;

          const sensacion =
            datosEjercicio?.sensacion === "facil" ||
              datosEjercicio?.sensacion === "bien" ||
              datosEjercicio?.sensacion === "dificil"
              ? datosEjercicio.sensacion
              : "bien";

          const estado = datosEjercicio?.estado ?? "completado";

          const nivelDolor =
            datosEjercicio?.nivelDolor?.trim() !== ""
              ? Number(datosEjercicio.nivelDolor)
              : 0;

          const fatiga =
            datosEjercicio?.fatiga?.trim() !== ""
              ? Number(datosEjercicio.fatiga)
              : 5;

          const descansoRecomendado = calcularDescansoRecomendado({
            grupoMuscular: ejercicio.grupo_muscular,
            series: seriesPlanificadas,
            repeticiones: repeticionesPlanificadas,
          });

          const descansoReal =
            datosEjercicio?.descansoReal?.trim() !== ""
              ? Number(datosEjercicio.descansoReal)
              : descansoRecomendado;

          const motivoParcial =
            datosEjercicio?.motivoParcial?.trim() !== ""
              ? datosEjercicio.motivoParcial.trim()
              : null;

          return {
            ejercicioId: ejercicio.id,
            nombre: ejercicio.nombre,
            grupo_muscular: ejercicio.grupo_muscular,
            series: seriesPlanificadas,
            repeticiones: repeticionesPlanificadas,
            estado,
            seriesReales,
            repeticionesReales,
            pesoUsado,
            sensacion,
            nivelDolor,
            fatiga,
            descansoRecomendado,
            descansoReal,
            motivoParcial,
          };
        });

      const ejercicioInvalido = ejerciciosSeleccionados.find((ejercicio) => {
        const repeticionesParaValidar =
          ejercicio.repeticionesReales.trim() === ejercicio.repeticiones.trim()
            ? ""
            : ejercicio.repeticionesReales;

        return !validarRepeticionesReales(
          ejercicio.seriesReales,
          repeticionesParaValidar,
        );
      });

      if (ejercicioInvalido) {
        setMensaje(
          `Revisa los datos reales de "${ejercicioInvalido.nombre}". El número de repeticiones debe coincidir con las series reales.`,
        );
        setGuardandoSesion(false);
        return;
      }

      const ejercicioDolorInvalido = ejerciciosSeleccionados.find(
        (ejercicio) => {
          return (
            ejercicio.nivelDolor !== null &&
            (!Number.isFinite(ejercicio.nivelDolor) ||
              ejercicio.nivelDolor < 0 ||
              ejercicio.nivelDolor > 10)
          );
        },
      );

      if (ejercicioDolorInvalido) {
        setMensaje(
          `Revisa el dolor de "${ejercicioDolorInvalido.nombre}". Debe estar entre 0 y 10.`,
        );
        setGuardandoSesion(false);
        return;
      }

      const ejercicioFatigaInvalida = ejerciciosSeleccionados.find(
        (ejercicio) => {
          return (
            ejercicio.fatiga !== null &&
            (!Number.isFinite(ejercicio.fatiga) ||
              ejercicio.fatiga < 0 ||
              ejercicio.fatiga > 10)
          );
        },
      );

      if (ejercicioFatigaInvalida) {
        setMensaje(
          `Revisa la fatiga de "${ejercicioFatigaInvalida.nombre}". Debe estar entre 0 y 10.`,
        );
        setGuardandoSesion(false);
        return;
      }

      const resultadoGuardado = await guardarSesionEntrenamientoAction({
        rutinaId,
        dia: diaActual.dia,
        tituloDia: diaActual.titulo,
        ejercicios: ejerciciosSeleccionados,
        sesionIdExistente: sesionExistenteDia?.id ?? null,
        notaSesion: notaSesion.trim() || null,
      });

      const nuevaSesionLocal: SesionGuardada = {
        id: resultadoGuardado.sesion.id,
        rutina_id: resultadoGuardado.sesion.rutina_id,
        dia: resultadoGuardado.sesion.dia,
        titulo_dia: resultadoGuardado.sesion.titulo_dia,
        fecha: resultadoGuardado.sesion.fecha,
        created_at: resultadoGuardado.sesion.created_at,
        sesion_ejercicios: resultadoGuardado.ejercicios.map((ejercicio) => ({
          ...ejercicio,
          estado_resultado: ejercicio.estado_resultado ?? "completado",
        })),
        nota_sesion: resultadoGuardado.sesion.nota_sesion,
      };

      setSesionesLocales((actuales) => {
        const sinDiaActual = actuales.filter(
          (sesion) => sesion.dia !== diaActual.dia,
        );

        return [nuevaSesionLocal, ...sinDiaActual];
      });

      setMensaje(
        sesionExistenteDia
          ? "Sesión actualizada correctamente. Los cambios ya se tendrán en cuenta en el progreso."
          : "Sesión guardada correctamente. El progreso ya se tendrá en cuenta para futuras adaptaciones.",
      );
    } catch (error) {
      console.error("Error al guardar sesión:", error);

      const mensajeError =
        error instanceof Error
          ? error.message
          : "Ha ocurrido un error al guardar la sesión.";

      setMensaje(mensajeError);
    } finally {
      setGuardandoSesion(false);
    }
  }

  if (!diaActual) {
    return (
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6">
        <p className="text-sm leading-6 text-slate-600">
          No hay información de entrenamiento para mostrar.
        </p>
      </div>
    );
  }

  const totalEjerciciosDia = diaActual.ejercicios.length;
  const totalSeriesDia = diaActual.ejercicios.reduce(
    (total, ejercicio) => total + ejercicio.series,
    0,
  );
  const pendientesDia = totalEjerciciosDia - ejerciciosCompletados.length;

  const mensajeTipo =
    mensaje.toLowerCase().includes("error") ||
      mensaje.toLowerCase().includes("revisa")
      ? "error"
      : mensaje.toLowerCase().includes("correctamente")
        ? "ok"
        : "info";

  return (
    <div className="space-y-6 p-5 md:p-6">
      <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {dias.map((dia) => {
          const activo = diaSeleccionado === dia.dia;
          const sesionGuardada = sesionesLocales.some(
            (sesion) => sesion.dia === dia.dia,
          );
          const seriesDia = dia.ejercicios.reduce(
            (total, ejercicio) => total + ejercicio.series,
            0,
          );

          return (
            <button
              key={dia.dia}
              type="button"
              onClick={() => {
                setDiaSeleccionado(dia.dia);
                setMensaje("");
                finalizarTemporizador();
              }}
              className={unirClases(
                "rounded-[1.5rem] border p-4 text-left shadow-sm transition hover:-translate-y-0.5",
                activo
                  ? "border-lime-300 bg-lime-50 ring-4 ring-lime-400/15"
                  : "border-slate-200 bg-white hover:border-lime-300 hover:bg-lime-50",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                    Día {dia.dia}
                  </p>

                  <p className="mt-2 text-base font-black text-slate-950">
                    {dia.titulo.replace(`Día ${dia.dia} - `, "")}
                  </p>

                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    {dia.ejercicios.length} ejercicios · {seriesDia} series
                  </p>
                </div>

                {sesionGuardada && (
                  <span className="rounded-full border border-lime-200 bg-lime-100 px-2 py-1 text-xs font-black text-lime-900">
                    Guardada
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className={estilos.texto.etiquetaVerde}>
              Sesión seleccionada
            </p>

            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
              {diaActual.titulo}
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Marca los ejercicios realizados. Si no rellenas series,
              repeticiones o descanso real, se guardará automáticamente lo
              planificado.
            </p>

            {sesionExistenteDia && (
              <div className="mt-4 rounded-[1.25rem] border border-lime-200 bg-lime-50 p-4 text-sm font-bold leading-6 text-lime-900">
                Ya existe una sesión guardada para este día. Puedes revisarla y
                actualizarla.
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-3 lg:justify-end">
            <button
              type="button"
              onClick={marcarTodosComoHechos}
              disabled={ejerciciosCompletados.length === totalEjerciciosDia}
              className={estilos.boton.secundario}
            >
              Marcar todo hecho
            </button>

            <button
              type="button"
              onClick={desmarcarTodos}
              disabled={ejerciciosCompletados.length === 0}
              className={estilos.boton.ghost}
            >
              Desmarcar todo
            </button>

            <button
              type="button"
              onClick={guardarSesion}
              disabled={guardandoSesion}
              className={estilos.boton.primarioGrande}
            >
              {guardandoSesion
                ? "Guardando..."
                : sesionExistenteDia
                  ? "Actualizar sesión"
                  : "Guardar sesión"}
            </button>
          </div>

        </div>

        {mensaje && (
          <div className="mt-5">
            <PanelMensaje mensaje={mensaje} tipo={mensajeTipo} />
          </div>
        )}

        <div className="mt-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
          <article className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-500">Ejercicios</p>
            <p className="mt-2 text-2xl font-black text-slate-950">
              {ejerciciosCompletados.length}/{totalEjerciciosDia}
            </p>
          </article>

          <article className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-500">Pendientes</p>
            <p className="mt-2 text-2xl font-black text-slate-950">
              {pendientesDia}
            </p>
          </article>

          <article className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-500">Series plan</p>
            <p className="mt-2 text-2xl font-black text-slate-950">
              {totalSeriesDia}
            </p>
          </article>

          <article className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-500">Estado</p>
            <p className="mt-2 text-2xl font-black text-slate-950">
              {sesionExistenteDia ? "Editando" : "Nueva"}
            </p>
          </article>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <details className="rounded-[1.5rem] border border-blue-200 bg-blue-50 p-5">
            <summary className="cursor-pointer list-none text-sm font-black uppercase tracking-[0.16em] text-blue-800">
              Cómo usar las sugerencias
            </summary>

            <div className="mt-4 text-sm leading-6 text-blue-950">
              <p>
                Si un ejercicio tiene historial previo, la aplicación muestra
                los últimos datos registrados para ayudarte a decidir si repetir,
                mantener o ajustar la exigencia.
              </p>

              <ul className="mt-3 space-y-1">
                <li>• Si el último registro fue estable, repite similar.</li>
                <li>• Si fue difícil, mantén o reduce exigencia.</li>
                <li>• Si fue fácil, puedes progresar ligeramente.</li>
              </ul>
            </div>
          </details>

          <details className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
            <summary className="cursor-pointer list-none text-sm font-black uppercase tracking-[0.16em] text-slate-600">
              Añadir nota de sesión
            </summary>

            <textarea
              value={notaSesion}
              onChange={(e) => setNotaSesion(e.target.value)}
              className={`${estilos.input.textarea} mt-4 h-24`}
              placeholder="Ej. Molestia leve, subir peso la próxima vez, sesión más corta..."
            />
          </details>
        </div>

        {resumenSesion && resumenSesion.ejerciciosCompletados > 0 && (
          <div className="mt-5 rounded-[1.5rem] border border-lime-200 bg-lime-50 p-5">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-lime-800">
              Resumen provisional
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <BadgeDato>
                {resumenSesion.ejerciciosCompletados} ejercicios
              </BadgeDato>

              <BadgeDato>{resumenSesion.totalSeriesReales} series</BadgeDato>

              <BadgeDato>
                {resumenSesion.totalPesoRegistrado} kg registrados
              </BadgeDato>

              <BadgeDato>Fácil: {resumenSesion.faciles}</BadgeDato>

              <BadgeDato>Difícil: {resumenSesion.dificiles}</BadgeDato>
            </div>
          </div>
        )}
      </section>

      <section className="space-y-4">
        {diaActual.ejercicios.map((ejercicio) => {
          const completado = ejerciciosCompletados.includes(ejercicio.id);
          const sensacionActual = datosReales[ejercicio.id]?.sensacion ?? "";
          const descansoRecomendadoEjercicio = calcularDescansoRecomendado({
            grupoMuscular: ejercicio.grupo_muscular,
            series: ejercicio.series,
            repeticiones: ejercicio.repeticiones,
          });

          const temporizadorDeEsteEjercicio =
            temporizadorEjercicioId === ejercicio.id;
          const estadoActual = datosReales[ejercicio.id]?.estado ?? "completado";
          const clasesEstado = obtenerClasesEstado(estadoActual, completado);
          const dolorEstado = obtenerEstadoDolor(
            datosReales[ejercicio.id]?.nivelDolor,
          );
          const fatigaEstado = obtenerEstadoFatiga(
            datosReales[ejercicio.id]?.fatiga,
          );

          return (
            <article
              key={ejercicio.id}
              className={unirClases(
                "rounded-[2rem] border p-5 shadow-sm transition md:p-6",
                clasesEstado.tarjeta,
              )}
            >
              <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-xl font-black text-slate-950">
                      {ejercicio.nombre}
                    </h3>

                    {completado && (
                      <span
                        className={unirClases(
                          "rounded-full border px-3 py-1 text-xs font-black",
                          clasesEstado.badge,
                        )}
                      >
                        {obtenerEtiquetaEstado(estadoActual)}
                      </span>
                    )}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <BadgeDato>{ejercicio.grupo_muscular}</BadgeDato>
                    <BadgeDato>{ejercicio.series} series</BadgeDato>
                    <BadgeDato>{ejercicio.repeticiones} reps</BadgeDato>
                    <BadgeDato>
                      Descanso {descansoRecomendadoEjercicio}s
                    </BadgeDato>
                  </div>

                  {completado && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-700">
                        Sensación: {formatearSensacionCorta(sensacionActual)}
                      </span>

                      <span
                        className={unirClases(
                          "rounded-full border px-3 py-1 text-xs font-bold",
                          dolorEstado.clase,
                        )}
                      >
                        {dolorEstado.texto}
                      </span>

                      <span
                        className={unirClases(
                          "rounded-full border px-3 py-1 text-xs font-bold",
                          fatigaEstado.clase,
                        )}
                      >
                        {fatigaEstado.texto}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 xl:justify-end">
                  {!completado ? (
                    <button
                      type="button"
                      onClick={() => cambiarEstadoEjercicio(ejercicio.id)}
                      className={estilos.boton.primario}
                    >
                      Marcar hecho
                    </button>
                  ) : (
                    <>
                      <BotonEstado
                        activo={estadoActual === "completado"}
                        tipo="hecho"
                        onClick={() =>
                          cambiarDatoReal(
                            ejercicio.id,
                            "estado",
                            "completado",
                          )
                        }
                      >
                        ✓ Hecho
                      </BotonEstado>

                      <BotonEstado
                        activo={estadoActual === "parcial"}
                        tipo="menos"
                        onClick={() =>
                          cambiarDatoReal(ejercicio.id, "estado", "parcial")
                        }
                      >
                        − Menos
                      </BotonEstado>

                      <BotonEstado
                        activo={estadoActual === "superado"}
                        tipo="mas"
                        onClick={() =>
                          cambiarDatoReal(ejercicio.id, "estado", "superado")
                        }
                      >
                        + Más
                      </BotonEstado>

                      <BotonEstado
                        activo={false}
                        tipo="neutral"
                        onClick={() => cambiarEstadoEjercicio(ejercicio.id)}
                      >
                        Desmarcar
                      </BotonEstado>
                    </>
                  )}
                </div>
              </div>

              {ejercicio.ultimoRegistro && (
                <details className="mt-5 rounded-[1.5rem] border border-blue-200 bg-white/80 p-5">
                  <summary className="cursor-pointer list-none text-sm font-black uppercase tracking-[0.16em] text-blue-800">
                    Ver sugerencia por historial
                  </summary>

                  <div className="mt-4">
                    <TarjetaSugerenciaEjercicio
                      ultimoRegistro={ejercicio.ultimoRegistro}
                    />
                  </div>
                </details>
              )}

              {completado && (
                <details className="mt-5 rounded-[1.5rem] border border-slate-200 bg-white p-5 open:bg-slate-50">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black uppercase tracking-[0.16em] text-slate-600 outline-none transition hover:border-lime-300 hover:bg-lime-50 focus-visible:ring-4 focus-visible:ring-lime-400/20">
                    <span>Editar datos reales y descanso</span>
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-black normal-case tracking-normal text-slate-500">
                      Opcional
                    </span>
                  </summary>

                  <div className="mt-5 space-y-5 rounded-[1.5rem] border border-slate-200 bg-white p-5">
                    <div>
                      <section className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                        <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                          Sensación del ejercicio
                        </p>

                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          Indica cómo se ha sentido el ejercicio para que FitAdapt pueda interpretar si mantener, reducir o progresar.
                        </p>

                        <div className="mt-4 flex flex-wrap gap-2">
                          {(["facil", "bien", "dificil"] as const).map(
                            (sensacion) => {
                              const activo = sensacionActual === sensacion;

                              const etiqueta =
                                sensacion === "facil"
                                  ? "Fácil"
                                  : sensacion === "bien"
                                    ? "Bien"
                                    : "Difícil";

                              return (
                                <button
                                  key={sensacion}
                                  type="button"
                                  onClick={() =>
                                    cambiarDatoReal(
                                      ejercicio.id,
                                      "sensacion",
                                      sensacion,
                                    )
                                  }
                                  className={unirClases(
                                    "rounded-2xl border px-5 py-3 text-sm font-black transition",
                                    activo
                                      ? "border-slate-950 bg-slate-950 text-white"
                                      : "border-slate-200 bg-white text-slate-700 hover:border-lime-300 hover:bg-lime-50",
                                  )}
                                >
                                  {etiqueta}
                                </button>
                              );
                            },
                          )}
                        </div>
                        </section>
                    </div>

                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                      <Campo
                        label="Series reales"
                        ayuda={`Planificadas: ${ejercicio.series}`}
                      >
                        <input
                          type="number"
                          min="0"
                          value={datosReales[ejercicio.id]?.seriesReales ?? ""}
                          onChange={(e) =>
                            cambiarDatoReal(
                              ejercicio.id,
                              "seriesReales",
                              e.target.value,
                            )
                          }
                          className={estilos.input.base}
                          placeholder={`Planificadas: ${ejercicio.series}`}
                        />
                      </Campo>

                      <Campo
                        label="Repeticiones reales"
                        ayuda={`Planificadas: ${ejercicio.repeticiones}`}
                      >
                        <input
                          type="text"
                          value={
                            datosReales[ejercicio.id]?.repeticionesReales ?? ""
                          }
                          onChange={(e) =>
                            cambiarDatoReal(
                              ejercicio.id,
                              "repeticionesReales",
                              e.target.value,
                            )
                          }
                          className={estilos.input.base}
                          placeholder={ejercicio.repeticiones}
                        />
                      </Campo>

                      <Campo label="Peso usado" ayuda="Opcional, en kg.">
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          value={datosReales[ejercicio.id]?.pesoUsado ?? ""}
                          onChange={(e) =>
                            cambiarDatoReal(
                              ejercicio.id,
                              "pesoUsado",
                              e.target.value,
                            )
                          }
                          className={estilos.input.base}
                          placeholder="Ej. 20 o 22.5"
                        />
                      </Campo>
                    </div>

                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                      <Campo
                        label="Dolor durante el ejercicio"
                        ayuda="0 = sin dolor, 10 = máximo."
                      >
                        <input
                          type="number"
                          min="0"
                          max="10"
                          value={datosReales[ejercicio.id]?.nivelDolor ?? ""}
                          onChange={(e) =>
                            cambiarDatoReal(
                              ejercicio.id,
                              "nivelDolor",
                              e.target.value,
                            )
                          }
                          className={estilos.input.base}
                          placeholder="0"
                        />
                      </Campo>

                      <Campo
                        label="Fatiga percibida"
                        ayuda="0 = sin fatiga, 10 = máxima."
                      >
                        <input
                          type="number"
                          min="0"
                          max="10"
                          value={datosReales[ejercicio.id]?.fatiga ?? ""}
                          onChange={(e) =>
                            cambiarDatoReal(
                              ejercicio.id,
                              "fatiga",
                              e.target.value,
                            )
                          }
                          className={estilos.input.base}
                          placeholder="5"
                        />
                      </Campo>
                    </div>

                    {datosReales[ejercicio.id]?.estado === "parcial" && (
                      <Campo
                        label="Motivo de haber hecho menos"
                        ayuda="Ayuda a interpretar si fue por dolor, fatiga o falta de tiempo."
                      >
                        <textarea
                          value={
                            datosReales[ejercicio.id]?.motivoParcial ?? ""
                          }
                          onChange={(e) =>
                            cambiarDatoReal(
                              ejercicio.id,
                              "motivoParcial",
                              e.target.value,
                            )
                          }
                          className={`${estilos.input.textarea} h-24`}
                          placeholder="Ej. dolor, fatiga, falta de tiempo..."
                        />
                      </Campo>
                    )}

                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                      <section className="rounded-[1.5rem] border border-blue-200 bg-blue-50 p-5">
                        <p className="text-sm font-bold text-blue-800">
                          Descanso recomendado
                        </p>

                        <p className="mt-2 text-3xl font-black text-blue-950">
                          {descansoRecomendadoEjercicio}s
                        </p>

                        <div className="mt-5 rounded-[1.25rem] border border-blue-200 bg-white p-4">
                          <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-700">
                            Temporizador
                          </p>

                          <p className="mt-2 text-4xl font-black tracking-tight text-slate-950">
                            {temporizadorDeEsteEjercicio
                              ? formatearTiempo(segundosRestantes)
                              : formatearTiempo(descansoRecomendadoEjercicio)}
                          </p>

                          {temporizadorDeEsteEjercicio &&
                            segundosRestantes === 0 && (
                              <p className="mt-2 text-sm font-bold text-lime-700">
                                Descanso terminado.
                              </p>
                            )}

                          <div className="mt-4 flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                iniciarTemporizador(
                                  ejercicio.id,
                                  descansoRecomendadoEjercicio,
                                )
                              }
                              className={estilos.boton.primario}
                            >
                              Iniciar
                            </button>

                            {temporizadorDeEsteEjercicio &&
                              temporizadorActivo && (
                                <button
                                  type="button"
                                  onClick={pausarTemporizador}
                                  className={estilos.boton.secundario}
                                >
                                  Pausar
                                </button>
                              )}

                            {temporizadorDeEsteEjercicio &&
                              !temporizadorActivo &&
                              segundosRestantes > 0 && (
                                <button
                                  type="button"
                                  onClick={reanudarTemporizador}
                                  className={estilos.boton.secundario}
                                >
                                  Reanudar
                                </button>
                              )}

                            <button
                              type="button"
                              onClick={() =>
                                reiniciarTemporizador(
                                  ejercicio.id,
                                  descansoRecomendadoEjercicio,
                                )
                              }
                              className={estilos.boton.secundario}
                            >
                              Reiniciar
                            </button>

                            {temporizadorDeEsteEjercicio && (
                              <button
                                type="button"
                                onClick={finalizarTemporizador}
                                className={estilos.boton.ghost}
                              >
                                Cerrar
                              </button>
                            )}
                          </div>
                        </div>
                      </section>

                      <Campo
                        label="Descanso real"
                        ayuda="Tiempo real descansado, en segundos."
                      >
                        <input
                          type="number"
                          min="0"
                          value={datosReales[ejercicio.id]?.descansoReal ?? ""}
                          onChange={(e) =>
                            cambiarDatoReal(
                              ejercicio.id,
                              "descansoReal",
                              e.target.value,
                            )
                          }
                          className={estilos.input.base}
                          placeholder={`Ej. ${descansoRecomendadoEjercicio}`}
                        />
                      </Campo>
                    </div>
                  </div>
                </details>
              )}
            </article>
          );
        })}
      </section>
    </div>
  );
}