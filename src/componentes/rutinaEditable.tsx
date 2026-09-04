"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { guardarRutinaEditada } from "@/app/rutina/acciones";
import type { Ejercicio } from "@/tipos/ejercicio";
import type { RutinaGenerada, EjercicioRutina } from "@/tipos/rutina";
import { obtenerSustituciones } from "@/lib/rutina/obtenerSustituciones";
import { interpretarSolicitudRutina } from "@/lib/rutina/nlp/interpretarSolicitudRutina";
import { aplicarSolicitudRutina } from "@/lib/rutina/nlp/aplicarSolicitudRutina";
import { estilos, unirClases } from "@/lib/ui/estilos";

type Props = {
  rutinaInicial: RutinaGenerada;
  ejerciciosDisponibles: Ejercicio[];
  equipamientoDisponiblePerfil?: string | null;
  molestiasPerfil?: string | null;
  rutinaIdExistente?: string | null;
};

type CambioReciente = {
  id: string;
  solicitud: string;
  cambios: string[];
};

function capitalizar(texto: string | null | undefined) {
  if (!texto) {
    return "No indicado";
  }

  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function textoAccionProgresion(accion: string) {
  return accion.replaceAll("_", " ");
}

function obtenerTipoMensajeGuardado(mensaje: string, rutinaGuardada: boolean) {
  const mensajeNormalizado = mensaje.toLowerCase();

  if (
    mensajeNormalizado.includes("error") ||
    mensajeNormalizado.includes("no se ha podido") ||
    mensajeNormalizado.includes("ha ocurrido")
  ) {
    return "error";
  }

  if (rutinaGuardada) {
    return "ok";
  }

  return "aviso";
}

function TarjetaEstadoEditor({
  label,
  valor,
  descripcion,
  tipo = "base",
}: {
  label: string;
  valor: string | number;
  descripcion: string;
  tipo?: "base" | "ok" | "aviso";
}) {
  return (
    <article
      className={unirClases(
        "rounded-[1.5rem] border p-5 shadow-sm",
        tipo === "base" && "border-slate-200 bg-white",
        tipo === "ok" && "border-lime-200 bg-lime-50",
        tipo === "aviso" && "border-amber-200 bg-amber-50",
      )}
    >
      <p className="text-sm font-medium text-slate-500">{label}</p>

      <p className="mt-2 text-xl font-black text-slate-950">{valor}</p>

      <p className="mt-2 text-xs leading-5 text-slate-500">{descripcion}</p>
    </article>
  );
}

function PanelMensaje({
  mensaje,
  tipo,
  children,
}: {
  mensaje: string;
  tipo: "ok" | "error" | "aviso" | "info";
  children?: React.ReactNode;
}) {
  return (
    <div
      className={unirClases(
        "rounded-[1.5rem] border p-5",
        tipo === "ok" && "border-lime-200 bg-lime-50 text-lime-950",
        tipo === "error" && "border-red-200 bg-red-50 text-red-950",
        tipo === "aviso" && "border-amber-200 bg-amber-50 text-amber-950",
        tipo === "info" && "border-blue-200 bg-blue-50 text-blue-950",
      )}
    >
      <p className="text-sm font-bold leading-6">{mensaje}</p>
      {children}
    </div>
  );
}

function obtenerResumenDia(ejercicios: EjercicioRutina[]) {
  const totalEjercicios = ejercicios.length;
  const totalSeries = ejercicios.reduce(
    (total, ejercicio) => total + ejercicio.series,
    0,
  );

  const grupos = Array.from(
    new Set(ejercicios.map((ejercicio) => ejercicio.grupo_muscular)),
  ).filter(Boolean);

  return {
    totalEjercicios,
    totalSeries,
    grupos,
  };
}

function BadgeDato({ children }: { children: React.ReactNode }) {
  return <span className={estilos.badge.base}>{children}</span>;
}

export default function RutinaEditable({
  rutinaInicial,
  ejerciciosDisponibles,
  equipamientoDisponiblePerfil,
  molestiasPerfil,
  rutinaIdExistente,
}: Props) {
  const [rutina, setRutina] = useState(rutinaInicial);
  const [indiceAbierto, setIndiceAbierto] = useState<string | null>(null);
  const [guardandoRutina, setGuardandoRutina] = useState(false);
  const [mensajeGuardado, setMensajeGuardado] = useState("");
  const [rutinaGuardada, setRutinaGuardada] = useState(
    Boolean(rutinaIdExistente),
  );
  const [rutinaIdActual, setRutinaIdActual] = useState<string | null>(
    rutinaIdExistente ?? null,
  );
  const [hayCambiosSinGuardar, setHayCambiosSinGuardar] = useState(false);

  const [textoSolicitud, setTextoSolicitud] = useState("");
  const [mensajeSolicitud, setMensajeSolicitud] = useState("");
  const [cambiosSolicitud, setCambiosSolicitud] = useState<string[]>([]);

  const [historialRutinas, setHistorialRutinas] = useState<RutinaGenerada[]>(
    [],
  );
  const [cambiosRecientes, setCambiosRecientes] = useState<CambioReciente[]>(
    [],
  );

  const router = useRouter();

  const totalEjercicios = rutina.dias.reduce(
    (total, dia) => total + dia.ejercicios.length,
    0,
  );

  const totalSeries = rutina.dias.reduce(
    (total, dia) =>
      total +
      dia.ejercicios.reduce(
        (subtotal, ejercicio) => subtotal + ejercicio.series,
        0,
      ),
    0,
  );

  function sustituirEjercicio(
    indiceDia: number,
    indiceEjercicio: number,
    ejercicioNuevo: EjercicioRutina,
  ) {
    setHistorialRutinas((actual) => [...actual, rutina]);

    const ejercicioAnterior =
      rutina.dias[indiceDia]?.ejercicios[indiceEjercicio];

    if (ejercicioAnterior) {
      setCambiosRecientes((actual) =>
        [
          {
            id: crypto.randomUUID(),
            solicitud: "Sustitución manual",
            cambios: [
              `Se ha cambiado ${ejercicioAnterior.nombre} por ${ejercicioNuevo.nombre}.`,
            ],
          },
          ...actual,
        ].slice(0, 5),
      );
    }

    setRutina((actual) => {
      const nuevosDias = [...actual.dias];
      const ejerciciosDia = [...nuevosDias[indiceDia].ejercicios];

      ejerciciosDia[indiceEjercicio] = ejercicioNuevo;

      nuevosDias[indiceDia] = {
        ...nuevosDias[indiceDia],
        ejercicios: ejerciciosDia,
      };

      return {
        ...actual,
        dias: nuevosDias,
      };
    });

    setHayCambiosSinGuardar(true);
    setRutinaGuardada(false);
    setMensajeGuardado("Tienes cambios sin guardar en la rutina.");
    setIndiceAbierto(null);
  }

async function guardarRutina() {
  const eraRutinaNueva = !rutinaIdActual;

  try {
    setGuardandoRutina(true);
    setMensajeGuardado("");

    const resultado = await guardarRutinaEditada(rutina, rutinaIdActual);

    if (!resultado.ok) {
      setMensajeGuardado(
        resultado.error ?? "No se ha podido guardar la rutina.",
      );
      return;
    }

    setRutinaGuardada(true);
    setHayCambiosSinGuardar(false);
    setRutinaIdActual(resultado.rutinaId ?? rutinaIdActual);
    setMensajeGuardado(
      "Rutina guardada correctamente. Ya puedes empezar o continuar el entrenamiento.",
    );
    setHistorialRutinas([]);
    setCambiosRecientes([]);
    setCambiosSolicitud([]);
    setMensajeSolicitud("");

    if (eraRutinaNueva) {
      router.replace("/rutina");
      router.refresh();
      return;
    }

    router.refresh();
  } catch {
    setMensajeGuardado("Ha ocurrido un error al guardar la rutina.");
  } finally {
    setGuardandoRutina(false);
  }
}

  function aplicarSolicitudTexto() {
    const solicitud = interpretarSolicitudRutina(textoSolicitud);

    if (solicitud.mensajes.length > 0) {
      setMensajeSolicitud(solicitud.mensajes.join(" "));
      setCambiosSolicitud([]);
      return;
    }

    const resultado = aplicarSolicitudRutina(
      rutina,
      solicitud,
      ejerciciosDisponibles,
      {
        equipamientoDisponiblePerfil,
        molestiasPerfil,
      },
    );

    setHistorialRutinas((actual) => [...actual, rutina]);

    setCambiosRecientes((actual) =>
      [
        {
          id: crypto.randomUUID(),
          solicitud: textoSolicitud.trim(),
          cambios: resultado.cambios,
        },
        ...actual,
      ].slice(0, 5),
    );

    setRutina(resultado.rutina);
    setCambiosSolicitud(resultado.cambios);
    setMensajeSolicitud(
      "Solicitud aplicada a la rutina. Revisa los cambios antes de guardar.",
    );
    setHayCambiosSinGuardar(true);
    setRutinaGuardada(false);
    setMensajeGuardado("Tienes cambios sin guardar en la rutina.");
  }

  function deshacerUltimoCambio() {
    if (historialRutinas.length === 0) {
      setMensajeSolicitud("No hay cambios recientes para deshacer.");
      return;
    }

    const ultimaRutina = historialRutinas[historialRutinas.length - 1];

    setRutina(ultimaRutina);
    setHistorialRutinas((actual) => actual.slice(0, -1));
    setCambiosRecientes((actual) => actual.slice(1));
    setCambiosSolicitud([]);
    setMensajeSolicitud("Se ha deshecho el último cambio aplicado.");
    setHayCambiosSinGuardar(true);
    setRutinaGuardada(false);
    setMensajeGuardado("Tienes cambios sin guardar en la rutina.");
  }

  const tipoMensajeGuardado = obtenerTipoMensajeGuardado(
    mensajeGuardado,
    rutinaGuardada,
  );

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <TarjetaEstadoEditor
          label="Estado del editor"
          valor={
            hayCambiosSinGuardar
              ? "Cambios pendientes"
              : rutinaGuardada
                ? "Guardada"
                : "Pendiente"
          }
          descripcion={
            hayCambiosSinGuardar
              ? "Guarda la rutina antes de entrenar."
              : rutinaGuardada
                ? "Lista para usar en entrenamiento."
                : "Revisa la propuesta antes de guardarla."
          }
          tipo={hayCambiosSinGuardar ? "aviso" : rutinaGuardada ? "ok" : "base"}
        />

        <TarjetaEstadoEditor
          label="Días"
          valor={rutina.dias.length}
          descripcion="Bloques de entrenamiento."
        />

        <TarjetaEstadoEditor
          label="Ejercicios"
          valor={totalEjercicios}
          descripcion="Ejercicios dentro del plan."
        />

        <TarjetaEstadoEditor
          label="Series"
          valor={totalSeries}
          descripcion="Volumen total previsto."
        />
      </section>

      {!rutinaGuardada && !hayCambiosSinGuardar && (
        <PanelMensaje
          mensaje="Esta rutina es una propuesta temporal. Todavía no se usará en entrenamiento hasta que pulses Guardar rutina."
          tipo="aviso"
        />
      )}

      <section className="rounded-[2rem] border border-slate-200 bg-slate-50 p-5 shadow-sm md:p-6">
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_0.85fr]">
          <div>
            <p className={estilos.texto.etiquetaVerde}>
              Modificación por lenguaje natural
            </p>

            <h3 className="mt-2 text-2xl font-black text-slate-950">
              Ajustar rutina con texto
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Escribe una petición para modificar el plan sin editar ejercicio
              por ejercicio. Puedes pedir más pierna, evitar un grupo muscular,
              acortar un día o cambiar el tipo de equipamiento.
            </p>

            <textarea
              value={textoSolicitud}
              onChange={(e) => setTextoSolicitud(e.target.value)}
              className={`${estilos.input.textarea} mt-5 h-28`}
              placeholder="Ej. Quiero más pierna y menos hombro."
            />

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={aplicarSolicitudTexto}
                disabled={textoSolicitud.trim().length === 0}
                className={estilos.boton.primario}
              >
                Aplicar solicitud
              </button>

              <button
                type="button"
                onClick={() => {
                  setTextoSolicitud("");
                  setMensajeSolicitud("");
                  setCambiosSolicitud([]);
                }}
                className={estilos.boton.secundario}
              >
                Limpiar texto
              </button>
            </div>
          </div>

          <aside className="rounded-[1.5rem] border border-blue-200 bg-blue-50 p-5">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-800">
              Ejemplos admitidos
            </p>

            <ul className="mt-4 space-y-2 text-sm leading-6 text-blue-950">
              <li>• Quiero más pierna y menos hombro.</li>
              <li>• Haz la rutina más corta.</li>
              <li>• Usa más mancuernas y evita máquinas.</li>
              <li>• Quita dominadas.</li>
              <li>• Quiero una rutina más suave.</li>
            </ul>
          </aside>
        </div>

        {mensajeSolicitud && (
          <div className="mt-5">
            <PanelMensaje mensaje={mensajeSolicitud} tipo="info">
              {cambiosSolicitud.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-black">
                    Cambios aplicados: {cambiosSolicitud.length}
                  </p>

                  <ul className="mt-3 space-y-2 text-sm leading-6">
                    {cambiosSolicitud.slice(0, 6).map((cambio) => (
                      <li key={cambio}>• {cambio}</li>
                    ))}
                  </ul>

                  {cambiosSolicitud.length > 6 && (
                    <p className="mt-3 text-xs font-bold">
                      +{cambiosSolicitud.length - 6} cambios más.
                    </p>
                  )}
                </div>
              )}
            </PanelMensaje>
          </div>
        )}

        {cambiosRecientes.length > 0 && (
          <details className="mt-5 rounded-[1.5rem] border border-slate-200 bg-white p-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-black text-slate-950">
              <span>Cambios recientes</span>

              <span className={estilos.badge.aviso}>
                {cambiosRecientes.length} pendiente
                {cambiosRecientes.length === 1 ? "" : "s"}
              </span>
            </summary>

            <div className="mt-5 space-y-3">
              {cambiosRecientes.slice(0, 3).map((item, indice) => (
                <article
                  key={item.id}
                  className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-sm font-black text-slate-950">
                        {indice === 0
                          ? "Último cambio"
                          : `Cambio anterior ${indice}`}
                      </p>

                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        {item.solicitud
                          ? `“${item.solicitud}”`
                          : "Solicitud sin texto"}
                      </p>
                    </div>

                    <span className={estilos.badge.base}>
                      {item.cambios.length} cambio
                      {item.cambios.length === 1 ? "" : "s"}
                    </span>
                  </div>

                  <ul className="mt-3 space-y-1 text-sm leading-6 text-slate-700">
                    {item.cambios.slice(0, 3).map((cambio) => (
                      <li key={cambio}>• {cambio}</li>
                    ))}
                  </ul>

                  {item.cambios.length > 3 && (
                    <p className="mt-2 text-xs text-slate-500">
                      +{item.cambios.length - 3} cambios más.
                    </p>
                  )}
                </article>
              ))}

              <div className="flex flex-wrap gap-3 border-t border-slate-200 pt-4">
                <button
                  type="button"
                  onClick={deshacerUltimoCambio}
                  disabled={historialRutinas.length === 0}
                  className={estilos.boton.secundario}
                >
                  Deshacer último cambio
                </button>

                <button
                  type="button"
                  onClick={() => setCambiosRecientes([])}
                  className={estilos.boton.ghost}
                >
                  Ocultar historial
                </button>
              </div>
            </div>
          </details>
        )}
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className={estilos.texto.etiquetaVerde}>Guardado</p>

            <h3 className="mt-2 text-2xl font-black text-slate-950">
              Guardar y activar rutina
            </h3>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Guarda la rutina para que esté disponible en la pantalla de
              entrenamiento. Si has hecho cambios, no se aplicarán hasta
              guardar.
            </p>
          </div>

          <button
            type="button"
            onClick={guardarRutina}
            disabled={guardandoRutina}
            className={estilos.boton.primario}
          >
            {guardandoRutina
              ? "Guardando..."
              : !rutinaIdActual
                ? "Guardar rutina"
                : hayCambiosSinGuardar
                  ? "Guardar cambios"
                  : "Guardar de nuevo"}
          </button>
        </div>

        {hayCambiosSinGuardar && (
          <div className="mt-5">
            <PanelMensaje
              mensaje="Hay cambios sin guardar. Guarda la rutina antes de ir a entrenamiento para que las modificaciones se apliquen en la sesión."
              tipo="aviso"
            />
          </div>
        )}

        {mensajeGuardado && (
          <div className="mt-5">
            <PanelMensaje mensaje={mensajeGuardado} tipo={tipoMensajeGuardado}>
              {rutinaGuardada && (
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link
                    href="/entrenamiento"
                    prefetch={false}
                    className={estilos.boton.primario}
                  >
                    Ir a entrenamiento
                  </Link>

                  <Link href="/inicio" className={estilos.boton.secundario}>
                    Volver al inicio
                  </Link>
                </div>
              )}
            </PanelMensaje>
          </div>
        )}
      </section>

      <section className="space-y-5">
        <div>
          <p className={estilos.texto.etiquetaVerde}>Días de entrenamiento</p>

          <h3 className="mt-2 text-3xl font-black text-slate-950">
            Plan semanal
          </h3>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Revisa cada día, consulta la técnica de los ejercicios y sustituye
            solo cuando necesites una alternativa compatible.
          </p>
        </div>

        {rutina.dias.map((dia, indiceDia) => {
          const resumenDia = obtenerResumenDia(dia.ejercicios);

          return (
            <section
              key={dia.dia}
              className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm md:p-6"
            >
              <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-lime-200 bg-lime-50 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-lime-800">
                    <span className="h-2 w-2 rounded-full bg-lime-400" />
                    Día {dia.dia}
                  </div>

                  <h4 className="text-2xl font-black text-slate-950">
                    {dia.titulo}
                  </h4>

                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {resumenDia.totalEjercicios} ejercicios ·{" "}
                    {resumenDia.totalSeries} series planificadas.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 lg:justify-end">
                  {resumenDia.grupos.slice(0, 5).map((grupo) => (
                    <span key={grupo} className={estilos.badge.base}>
                      {grupo}
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                {dia.ejercicios.map((ejercicio, indiceEjercicio) => {
                  const clave = `${indiceDia}-${indiceEjercicio}`;

                  const nombresYaUsados = dia.ejercicios
                    .filter((_, indice) => indice !== indiceEjercicio)
                    .map((item) => item.nombre);

                  const alternativas = obtenerSustituciones(
                    ejerciciosDisponibles,
                    {
                      nombreEjercicioActual: ejercicio.nombre,
                      grupoMuscular: ejercicio.grupo_muscular,
                      patronMovimiento: ejercicio.patron_movimiento,
                      equipoDisponiblePerfil: equipamientoDisponiblePerfil,
                      molestiasPerfil,
                      nombresYaUsados,
                    },
                  );

                  const panelAbierto = indiceAbierto === clave;

                  return (
                    <article
                      key={clave}
                      className={unirClases(
                        "rounded-[1.5rem] border p-4 transition md:p-5",
                        panelAbierto
                          ? "border-lime-300 bg-lime-50/60"
                          : "border-slate-200 bg-slate-50 hover:border-lime-300",
                      )}
                    >
                      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                            <div>
                              <Link href={`/ejercicios/${ejercicio.id}`}>
                                <h5 className="text-lg font-black text-slate-950 hover:underline">
                                  {ejercicio.nombre}
                                </h5>
                              </Link>

                              <div className="mt-3 flex flex-wrap gap-2">
                                <BadgeDato>
                                  {ejercicio.grupo_muscular}
                                </BadgeDato>

                                <BadgeDato>
                                  {ejercicio.patron_movimiento ||
                                    "Patrón no indicado"}
                                </BadgeDato>

                                <BadgeDato>{ejercicio.series} series</BadgeDato>

                                <BadgeDato>
                                  {ejercicio.repeticiones} reps
                                </BadgeDato>

                                {ejercicio.dificultad && (
                                  <BadgeDato>
                                    {capitalizar(ejercicio.dificultad)}
                                  </BadgeDato>
                                )}
                              </div>

                              {ejercicio.explicacion_seleccion &&
                                !ejercicio.explicacion_progresion && (
                                  <p className="mt-3 text-sm leading-6 text-slate-600">
                                    Seleccionado por compatibilidad con el
                                    perfil, el objetivo y el equipamiento
                                    disponible.
                                  </p>
                                )}
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                setIndiceAbierto((actual) =>
                                  actual === clave ? null : clave,
                                )
                              }
                              className={estilos.boton.secundario}
                            >
                              {panelAbierto ? "Ocultar" : "Sustituir"}
                            </button>
                          </div>

                          {ejercicio.explicacion_progresion && (
                            <details className="mt-4 rounded-[1.25rem] border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950">
                              <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                                <span className="font-black">
                                  {ejercicio.explicacion_progresion.motivo
                                    .toLowerCase()
                                    .includes("solicitud escrita")
                                    ? "Ajuste por solicitud"
                                    : "Ajuste por progreso"}
                                </span>

                                <span className="text-xs font-bold">
                                  {textoAccionProgresion(
                                    ejercicio.explicacion_progresion.accion,
                                  )}
                                  {" · "}
                                  {
                                    ejercicio.explicacion_progresion
                                      .seriesOriginales
                                  }{" "}
                                  →{" "}
                                  {
                                    ejercicio.explicacion_progresion
                                      .seriesFinales
                                  }
                                </span>
                              </summary>

                              <p className="mt-3 leading-6">
                                {ejercicio.explicacion_progresion.motivo}
                              </p>

                              <div className="mt-3 grid grid-cols-1 gap-2 text-xs sm:grid-cols-3">
                                <div className="rounded-xl border border-blue-200 bg-white p-3">
                                  <p className="text-blue-600">Acción</p>
                                  <p className="mt-1 font-black">
                                    {textoAccionProgresion(
                                      ejercicio.explicacion_progresion.accion,
                                    )}
                                  </p>
                                </div>

                                <div className="rounded-xl border border-blue-200 bg-white p-3">
                                  <p className="text-blue-600">Series</p>
                                  <p className="mt-1 font-black">
                                    {
                                      ejercicio.explicacion_progresion
                                        .seriesOriginales
                                    }{" "}
                                    →{" "}
                                    {
                                      ejercicio.explicacion_progresion
                                        .seriesFinales
                                    }
                                  </p>
                                </div>

                                <div className="rounded-xl border border-blue-200 bg-white p-3">
                                  <p className="text-blue-600">Ejercicio</p>
                                  <p className="mt-1 font-black">
                                    {ejercicio.explicacion_progresion
                                      .nombreOriginal ===
                                      ejercicio.explicacion_progresion.nombreFinal
                                      ? "Se mantiene"
                                      : `${ejercicio.explicacion_progresion.nombreOriginal} → ${ejercicio.explicacion_progresion.nombreFinal}`}
                                  </p>
                                </div>
                              </div>
                            </details>
                          )}
                        </div>
                      </div>

                      {panelAbierto && (
                        <div className="mt-5 rounded-[1.5rem] border border-slate-200 bg-white p-5">
                          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                            <div>
                              <p className="text-sm font-black uppercase tracking-[0.16em] text-slate-500">
                                Alternativas compatibles
                              </p>

                              <h6 className="mt-2 text-xl font-black text-slate-950">
                                Sustituir ejercicio
                              </h6>

                              <p className="mt-2 text-sm leading-6 text-slate-600">
                                Se muestran ejercicios del mismo grupo muscular
                                y patrón, o alternativas cercanas compatibles
                                con tu perfil.
                              </p>
                            </div>

                            <span className={estilos.badge.info}>
                              {alternativas.length} alternativa
                              {alternativas.length === 1 ? "" : "s"}
                            </span>
                          </div>

                          {alternativas.length === 0 ? (
                            <PanelMensaje
                              mensaje="No se han encontrado alternativas compatibles para este ejercicio."
                              tipo="aviso"
                            />
                          ) : (
                            <div className="grid grid-cols-1 gap-3">
                              {alternativas.slice(0, 5).map((alternativa) => (
                                <article
                                  key={alternativa.id}
                                  className="flex flex-col gap-4 rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4 md:flex-row md:items-center md:justify-between"
                                >
                                  <div>
                                    <p className="font-black text-slate-950">
                                      {alternativa.nombre}
                                    </p>

                                    <div className="mt-3 flex flex-wrap gap-2">
                                      <BadgeDato>
                                        {alternativa.grupo_muscular}
                                      </BadgeDato>

                                      <BadgeDato>
                                        {alternativa.patron_movimiento ||
                                          "Patrón no indicado"}
                                      </BadgeDato>

                                      <BadgeDato>
                                        {alternativa.equipamiento ||
                                          "Sin equipamiento"}
                                      </BadgeDato>

                                      {alternativa.dificultad && (
                                        <BadgeDato>
                                          {capitalizar(alternativa.dificultad)}
                                        </BadgeDato>
                                      )}
                                    </div>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      sustituirEjercicio(
                                        indiceDia,
                                        indiceEjercicio,
                                        {
                                          id: alternativa.id,
                                          nombre: alternativa.nombre,
                                          grupo_muscular:
                                            alternativa.grupo_muscular,
                                          patron_movimiento:
                                            alternativa.patron_movimiento,
                                          dificultad: alternativa.dificultad,
                                          series: ejercicio.series,
                                          repeticiones: ejercicio.repeticiones,
                                        },
                                      )
                                    }
                                    className={estilos.boton.primario}
                                  >
                                    Elegir
                                  </button>
                                </article>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}
      </section>
    </div>
  );
}
