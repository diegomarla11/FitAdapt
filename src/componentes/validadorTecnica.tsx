"use client";

import { useEffect, useRef, useState } from "react";
import "@tensorflow/tfjs-backend-webgl";
import * as tf from "@tensorflow/tfjs";
import * as poseDetection from "@tensorflow-models/pose-detection";
import { evaluarTecnica } from "@/lib/validacion/evaluarTecnica";
import type {
  EjercicioValidable,
  PuntoPose,
  ResultadoValidacionTecnica,
} from "@/tipos/validacionTecnica";
import { estilos, unirClases } from "@/lib/ui/estilos";

const ejerciciosDisponibles: {
  valor: EjercicioValidable;
  etiqueta: string;
}[] = [
  { valor: "sentadilla", etiqueta: "Sentadilla" },
  { valor: "flexiones", etiqueta: "Flexiones" },
  { valor: "hip_thrust", etiqueta: "Hip thrust" },
  { valor: "press_hombro", etiqueta: "Press de hombro" },
  { valor: "curl_biceps", etiqueta: "Curl de bíceps" },
];

type DetectorPose = poseDetection.PoseDetector;

function obtenerColorEstado(estado: ResultadoValidacionTecnica["estado"]) {
  if (estado === "correcto") {
    return {
      contenedor: "border-lime-200 bg-lime-50 text-lime-950",
      badge: estilos.badge.activo,
      titulo: "Correcto",
    };
  }

  if (estado === "aceptable") {
    return {
      contenedor: "border-blue-200 bg-blue-50 text-blue-950",
      badge: estilos.badge.info,
      titulo: "Aceptable",
    };
  }

  if (estado === "mejorable") {
    return {
      contenedor: "border-amber-200 bg-amber-50 text-amber-950",
      badge: estilos.badge.aviso,
      titulo: "Mejorable",
    };
  }

  return {
    contenedor: "border-slate-200 bg-slate-50 text-slate-800",
    badge: estilos.badge.base,
    titulo: "Sin clasificar",
  };
}

function PasoAnalisis({
  numero,
  titulo,
  descripcion,
  activo = false,
}: {
  numero: string;
  titulo: string;
  descripcion: string;
  activo?: boolean;
}) {
  return (
    <article
      className={unirClases(
        "rounded-[1.5rem] border p-4 transition",
        activo
          ? "border-lime-300 bg-lime-50"
          : "border-slate-200 bg-white",
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={unirClases(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-black",
            activo
              ? "bg-lime-400 text-slate-950"
              : "bg-slate-100 text-slate-600",
          )}
        >
          {numero}
        </span>

        <div>
          <p className="text-sm font-black text-slate-950">{titulo}</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            {descripcion}
          </p>
        </div>
      </div>
    </article>
  );
}

function RecomendacionGrabacion({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-3 text-sm leading-6 text-blue-900">
      <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
      <span>{children}</span>
    </li>
  );
}

export default function ValidadorTecnica() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const detectorRef = useRef<DetectorPose | null>(null);
  const videoUrlRef = useRef<string | null>(null);

  const [ejercicio, setEjercicio] = useState<EjercicioValidable>("sentadilla");
  const [videoCargado, setVideoCargado] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoValidacionTecnica | null>(
    null,
  );
  const [mensaje, setMensaje] = useState("");
  const [progreso, setProgreso] = useState("");

  function cargarVideo(file: File | null) {
    setMensaje("");
    setResultado(null);
    setProgreso("");

    if (!file) {
      return;
    }

    if (!file.type.startsWith("video/")) {
      setMensaje("Selecciona un archivo de vídeo válido.");
      return;
    }

    const tamanoMaximoMb = 50;
    const tamanoMaximoBytes = tamanoMaximoMb * 1024 * 1024;

    if (file.size > tamanoMaximoBytes) {
      setMensaje(
        "El vídeo es demasiado grande. Usa un vídeo corto de menos de 50 MB.",
      );
      return;
    }

    if (videoUrlRef.current) {
      URL.revokeObjectURL(videoUrlRef.current);
    }

    const url = URL.createObjectURL(file);
    videoUrlRef.current = url;

    if (videoRef.current) {
      videoRef.current.src = url;
      videoRef.current.load();
      setVideoCargado(true);
    }
  }

  async function obtenerDetector() {
    if (detectorRef.current) {
      return detectorRef.current;
    }

    setProgreso("Cargando modelo de visión artificial...");

    await tf.setBackend("webgl");
    await tf.ready();

    const detector = await poseDetection.createDetector(
      poseDetection.SupportedModels.MoveNet,
      {
        modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
      },
    );

    detectorRef.current = detector;

    return detector;
  }

  async function esperarCargaVideo(video: HTMLVideoElement) {
    if (video.readyState >= 2) {
      return;
    }

    await new Promise<void>((resolve) => {
      video.onloadeddata = () => resolve();
    });
  }

  async function analizarVideo() {
    const video = videoRef.current;

    if (!video) {
      setMensaje("No hay vídeo cargado.");
      return;
    }

    try {
      setProcesando(true);
      setMensaje("");
      setResultado(null);

      await esperarCargaVideo(video);

      const detector = await obtenerDetector();

      const duracion = video.duration;
      const duracionAnalisis = Math.min(duracion, 12);

      if (!Number.isFinite(duracion) || duracion <= 0) {
        setMensaje("No se ha podido leer la duración del vídeo.");
        return;
      }

      const numeroMuestras = Math.min(
        24,
        Math.max(8, Math.floor(duracionAnalisis * 3)),
      );
      const frames: PuntoPose[][] = [];

      video.pause();

      for (let indice = 0; indice < numeroMuestras; indice++) {
        const tiempo =
          numeroMuestras === 1
            ? 0
            : (duracionAnalisis * indice) / (numeroMuestras - 1);

        setProgreso(`Analizando frame ${indice + 1} de ${numeroMuestras}...`);

        video.currentTime = tiempo;

        await new Promise<void>((resolve) => {
          video.onseeked = () => resolve();
        });

        const poses = await detector.estimatePoses(video);
        const primeraPose = poses[0];

        if (primeraPose?.keypoints?.length) {
          frames.push(
            primeraPose.keypoints.map((punto) => ({
              name: punto.name ?? "",
              x: punto.x,
              y: punto.y,
              score: punto.score,
            })),
          );
        }
      }

      const resultadoEvaluacion = evaluarTecnica(ejercicio, frames);

      setResultado(resultadoEvaluacion);
      setProgreso("Análisis completado.");
    } catch (error) {
      console.error("Error analizando técnica:", error);
      setMensaje(
        "No se ha podido analizar el vídeo. Prueba con un vídeo más corto, buena iluminación y cuerpo completo visible.",
      );
      setProgreso("");
    } finally {
      setProcesando(false);
    }
  }

  useEffect(() => {
    return () => {
      if (videoUrlRef.current) {
        URL.revokeObjectURL(videoUrlRef.current);
      }
    };
  }, []);

  const estadoResultado = resultado
    ? obtenerColorEstado(resultado.estado)
    : null;

  return (
    <section className={estilos.tarjeta.base}>
      <div className="mb-8">
        <p className={estilos.texto.etiquetaVerde}>Analizador técnico</p>

        <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
          Revisión de técnica por vídeo
        </h2>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Selecciona el ejercicio, sube un vídeo corto y ejecuta el análisis. El
          resultado será una orientación aproximada basada en los puntos
          corporales detectados.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-4">
        <PasoAnalisis
          numero="1"
          titulo="Ejercicio"
          descripcion="Selecciona el patrón que se va a analizar."
          activo
        />

        <PasoAnalisis
          numero="2"
          titulo="Vídeo"
          descripcion="Sube un clip corto y estable."
          activo={videoCargado}
        />

        <PasoAnalisis
          numero="3"
          titulo="Análisis"
          descripcion="MoveNet detecta puntos corporales."
          activo={procesando}
        />

        <PasoAnalisis
          numero="4"
          titulo="Resultado"
          descripcion="Revisa puntuación y mensajes."
          activo={Boolean(resultado)}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-5">
          <section className="rounded-[1.5rem] border border-blue-200 bg-blue-50 p-5">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-800">
              Recomendaciones de grabación
            </p>

            <h3 className="mt-2 text-xl font-black text-blue-950">
              Graba el movimiento completo
            </h3>

            <ul className="mt-4 space-y-2">
              <RecomendacionGrabacion>
                Cámara fija, sin movimientos bruscos.
              </RecomendacionGrabacion>

              <RecomendacionGrabacion>
                Vídeo corto, idealmente de 3 a 8 segundos.
              </RecomendacionGrabacion>

              <RecomendacionGrabacion>
                Cuerpo completo visible durante todo el ejercicio.
              </RecomendacionGrabacion>

              <RecomendacionGrabacion>
                Ropa que permita distinguir brazos, piernas y tronco.
              </RecomendacionGrabacion>
            </ul>
          </section>

          <section className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
            <div className="grid grid-cols-1 gap-4">
              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                  Ejercicio
                </span>

                <select
                  value={ejercicio}
                  onChange={(e) =>
                    setEjercicio(e.target.value as EjercicioValidable)
                  }
                  className={estilos.input.select}
                >
                  {ejerciciosDisponibles.map((item) => (
                    <option key={item.valor} value={item.valor}>
                      {item.etiqueta}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                  Vídeo
                </span>

                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => cargarVideo(e.target.files?.[0] ?? null)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 file:mr-4 file:rounded-xl file:border-0 file:bg-slate-950 file:px-4 file:py-2 file:text-sm file:font-bold file:text-white hover:file:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-lime-500/15"
                />
              </label>

              <button
                type="button"
                onClick={analizarVideo}
                disabled={!videoCargado || procesando}
                className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-6 py-4 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-lime-400/30 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {procesando ? "Analizando técnica..." : "Analizar técnica"}
              </button>
            </div>
          </section>

          {progreso && (
            <div className="rounded-[1.5rem] border border-blue-200 bg-blue-50 p-4 text-sm font-bold leading-6 text-blue-900">
              {progreso}
            </div>
          )}

          {mensaje && (
            <div className={estilos.tarjeta.error}>
              <p className="text-sm font-bold leading-6 text-red-900">
                {mensaje}
              </p>
            </div>
          )}
        </div>

        <div className="space-y-5">
          <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-950 shadow-sm">
            <div className="border-b border-white/10 bg-slate-900 px-5 py-4">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-lime-300">
                Vista previa
              </p>
            </div>

            <video
              ref={videoRef}
              controls
              playsInline
              className="aspect-video w-full bg-slate-950 object-contain"
            />
          </section>

          {resultado && estadoResultado && (
            <section
              className={unirClases(
                "rounded-[2rem] border p-6 shadow-sm",
                estadoResultado.contenedor,
              )}
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] opacity-80">
                    Resultado técnico
                  </p>

                  <h3 className="mt-2 text-3xl font-black tracking-tight">
                    {estadoResultado.titulo}
                  </h3>

                  <p className="mt-2 text-sm leading-6">
                    Evaluación aproximada de la ejecución detectada en el vídeo.
                  </p>
                </div>

                <div className="rounded-[1.25rem] border border-white/70 bg-white px-5 py-4 text-center text-slate-950 shadow-sm">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                    Puntuación
                  </p>

                  <p className="mt-1 text-3xl font-black">
                    {resultado.puntuacion}
                  </p>

                  <p className="text-xs font-bold text-slate-500">/100</p>
                </div>
              </div>

              <div className="mt-5 rounded-[1.5rem] border border-white/70 bg-white/80 p-5 text-slate-950">
                <p className="text-sm font-black text-slate-950">
                  Mensajes detectados
                </p>

                <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
                  {resultado.mensajes.map((mensajeResultado) => (
                    <li key={mensajeResultado} className="flex gap-3">
                      <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-lime-400" />
                      <span>{mensajeResultado}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <p className="mt-4 text-xs font-bold opacity-80">
                Frames analizados: {resultado.framesAnalizados}
              </p>
            </section>
          )}

          <section className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
              Limitaciones del análisis
            </p>

            <h3 className="mt-2 text-xl font-black text-slate-950">
              Orientación, no diagnóstico profesional
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Este módulo ofrece una orientación técnica aproximada basada en
              puntos corporales detectados por visión artificial. No sustituye
              la valoración de un profesional y puede fallar si el vídeo no
              muestra bien el cuerpo.
            </p>
          </section>
        </div>
      </div>
    </section>
  );
}