import Link from "next/link";
import CabeceraPagina from "@/componentes/cabeceraPagina";
import { obtenerDatosProgreso } from "@/lib/progreso/obtenerDatosProgreso";
import PanelProgresoVisual from "@/componentes/panelProgresoVisual";
import { obtenerUsuarioActual } from "@/lib/auth/obtenerUsuarioActual";
import PanelGraficasHistoricas from "@/componentes/panelGraficasHistoricas";
import ContenedorApp from "@/componentes/contenedorApp";
import { estilos, unirClases } from "@/lib/ui/estilos";

function formatearPorcentaje(valor: number) {
  return `${Math.round(valor * 100)}%`;
}

function formatearNumero(valor: number | null, decimales = 1) {
  if (valor === null || !Number.isFinite(valor)) {
    return "-";
  }

  return valor.toFixed(decimales);
}

function formatearSegundos(valor: number | null) {
  if (valor === null || !Number.isFinite(valor)) {
    return "-";
  }

  return `${Math.round(valor)} s`;
}

function obtenerDiagnosticoProgreso(
  resumenGlobal: {
    sesionesTotales: number;
    ejerciciosTotales: number;
    seriesTotales: number;
    pesoTotalRegistrado: number;
    faciles: number;
    dificiles: number;
  } | null,
  resumenPorEjercicio: {
    estado:
      | "muy_bien"
      | "bien"
      | "neutro"
      | "fatiga"
      | "bajo_rendimiento"
      | "dolor"
      | "sin_datos";
  }[],
) {
  if (!resumenGlobal || resumenGlobal.sesionesTotales === 0) {
    return {
      tipo: "info" as const,
      titulo: "Sin datos suficientes",
      descripcion:
        "Todavía no hay sesiones suficientes para interpretar el progreso. Registra varios entrenamientos para obtener una valoración más fiable.",
      recomendacion:
        "Completa varias sesiones usando datos reales de series, repeticiones, peso, dolor, fatiga y sensación.",
    };
  }

  const ejerciciosConFatiga = resumenPorEjercicio.filter(
    (ejercicio) =>
      ejercicio.estado === "fatiga" ||
      ejercicio.estado === "bajo_rendimiento",
  ).length;

  const ejerciciosConDolor = resumenPorEjercicio.filter(
    (ejercicio) => ejercicio.estado === "dolor",
  ).length;

  const ejerciciosConBuenEstado = resumenPorEjercicio.filter(
    (ejercicio) =>
      ejercicio.estado === "muy_bien" || ejercicio.estado === "bien",
  ).length;

  if (ejerciciosConDolor > 0) {
    return {
      tipo: "error" as const,
      titulo: "Atención al dolor",
      descripcion:
        "Se han detectado señales de dolor en uno o varios ejercicios recientes. Esto puede indicar que alguna variante, carga o patrón de movimiento no está siendo bien tolerado.",
      recomendacion:
        "Prioriza cambiar variantes conflictivas, reducir exigencia y evitar progresar en ejercicios donde aparezca dolor repetido.",
    };
  }

  if (
    ejerciciosConFatiga >= 2 ||
    resumenGlobal.dificiles > resumenGlobal.faciles
  ) {
    return {
      tipo: "aviso" as const,
      titulo: "Atención a la fatiga",
      descripcion:
        "Hay señales de dificultad acumulada en algunos ejercicios o sesiones. Esto puede indicar que conviene controlar la exigencia antes de seguir aumentando volumen o intensidad.",
      recomendacion:
        "Prioriza mantener cargas, cuidar la técnica y revisar los ejercicios marcados como difíciles o con bajo rendimiento.",
    };
  }

  if (
    ejerciciosConBuenEstado >= 3 &&
    resumenGlobal.faciles >= resumenGlobal.dificiles
  ) {
    return {
      tipo: "ok" as const,
      titulo: "Progreso estable",
      descripcion:
        "La mayoría de registros muestran cumplimiento correcto y sensaciones controladas. El entrenamiento parece estar respondiendo bien al perfil actual.",
      recomendacion:
        "Puedes seguir con la rutina actual y aplicar progresiones moderadas en ejercicios que se repitan con buena sensación.",
    };
  }

  return {
    tipo: "info" as const,
    titulo: "Progreso neutro",
    descripcion:
      "Los datos muestran una evolución equilibrada, sin señales claras de fatiga elevada ni de progresión destacada.",
    recomendacion:
      "Continúa registrando sesiones para que la aplicación pueda detectar tendencias más claras.",
  };
}

function formatearEstado(
  estado:
    | "muy_bien"
    | "bien"
    | "neutro"
    | "fatiga"
    | "bajo_rendimiento"
    | "dolor"
    | "sin_datos",
) {
  switch (estado) {
    case "muy_bien":
      return "Muy bien";
    case "bien":
      return "Bien";
    case "neutro":
      return "Neutro";
    case "fatiga":
      return "Fatiga";
    case "bajo_rendimiento":
      return "Bajo rendimiento";
    case "dolor":
      return "Dolor";
    default:
      return "Sin datos";
  }
}

function obtenerClaseEstado(
  estado:
    | "muy_bien"
    | "bien"
    | "neutro"
    | "fatiga"
    | "bajo_rendimiento"
    | "dolor"
    | "sin_datos",
) {
  if (estado === "muy_bien" || estado === "bien") {
    return "border-lime-200 bg-lime-50 text-lime-900";
  }

  if (estado === "fatiga" || estado === "bajo_rendimiento") {
    return "border-amber-200 bg-amber-50 text-amber-900";
  }

  if (estado === "dolor") {
    return "border-red-200 bg-red-50 text-red-900";
  }

  if (estado === "neutro") {
    return "border-blue-200 bg-blue-50 text-blue-900";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
}

function TarjetaMetrica({
  label,
  valor,
  descripcion,
  tipo = "base",
}: {
  label: string;
  valor: string | number;
  descripcion: string;
  tipo?: "base" | "ok" | "info" | "aviso" | "error";
}) {
  return (
    <article
      className={unirClases(
        "rounded-[1.5rem] border p-5 shadow-sm",
        tipo === "base" && "border-slate-200 bg-white",
        tipo === "ok" && "border-lime-200 bg-lime-50",
        tipo === "info" && "border-blue-200 bg-blue-50",
        tipo === "aviso" && "border-amber-200 bg-amber-50",
        tipo === "error" && "border-red-200 bg-red-50",
      )}
    >
      <p className="text-sm font-medium text-slate-500">{label}</p>

      <p className="mt-2 text-3xl font-black tracking-tight text-slate-950">
        {valor}
      </p>

      <p className="mt-2 text-xs leading-5 text-slate-500">{descripcion}</p>
    </article>
  );
}

function PanelDiagnostico({
  diagnostico,
}: {
  diagnostico: ReturnType<typeof obtenerDiagnosticoProgreso>;
}) {
  const clases = {
    ok: "border-lime-200 bg-lime-50 text-lime-950",
    info: "border-blue-200 bg-blue-50 text-blue-950",
    aviso: "border-amber-200 bg-amber-50 text-amber-950",
    error: "border-red-200 bg-red-50 text-red-950",
  };

  const etiquetas = {
    ok: "Estado favorable",
    info: "Diagnóstico automático",
    aviso: "Revisión recomendada",
    error: "Atención prioritaria",
  };

  return (
    <section
      className={unirClases(
        "rounded-[2rem] border p-6 shadow-sm md:p-8",
        clases[diagnostico.tipo],
      )}
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_0.85fr] lg:items-start">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] opacity-80">
            {etiquetas[diagnostico.tipo]}
          </p>

          <h2 className="mt-3 text-3xl font-black tracking-tight">
            {diagnostico.titulo}
          </h2>

          <p className="mt-3 max-w-3xl text-sm leading-6">
            {diagnostico.descripcion}
          </p>
        </div>

        <article className="rounded-[1.5rem] border border-white/70 bg-white/80 p-5 text-slate-950 shadow-sm">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-slate-500">
            Recomendación
          </p>

          <p className="mt-3 text-sm font-medium leading-6 text-slate-700">
            {diagnostico.recomendacion}
          </p>
        </article>
      </div>
    </section>
  );
}

function EstadoVacioProgreso() {
  return (
    <section className={estilos.tarjeta.base}>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_0.8fr] lg:items-center">
        <div>
          <p className={estilos.texto.etiquetaVerde}>Progreso pendiente</p>

          <h2 className="mt-2 text-3xl font-black text-slate-950">
            Todavía no hay datos suficientes
          </h2>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
            Para generar análisis visual necesitas guardar sesiones de
            entrenamiento con ejercicios completados, series reales, sensación,
            dolor, fatiga y descanso.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/entrenamiento" className={estilos.boton.primario}>
              Registrar entrenamiento
            </Link>

            <Link href="/rutina" className={estilos.boton.secundario}>
              Ver rutina
            </Link>
          </div>
        </div>

        <aside className={estilos.tarjeta.destacada}>
          <p className={estilos.texto.etiquetaVerde}>Siguiente paso</p>

          <h3 className="mt-2 text-2xl font-black text-slate-950">
            Completar varias sesiones
          </h3>

          <p className="mt-3 text-sm leading-6 text-slate-700">
            Cuantos más registros reales haya, mejor podrá detectar la app
            patrones de fatiga, dolor, cumplimiento y progreso.
          </p>
        </aside>
      </div>
    </section>
  );
}

export default async function PaginaProgreso() {
  await obtenerUsuarioActual();

  const {
    resumenGlobal,
    resumenPorGrupo,
    resumenPorEjercicio,
    evolucionProgreso,
    ultimasSesiones,
  } = await obtenerDatosProgreso();

  const resumenGlobalVisual = resumenGlobal
    ? {
        sesionesTotales: resumenGlobal.sesionesTotales,
        ejerciciosTotales: resumenGlobal.ejerciciosTotales,
        seriesTotales: resumenGlobal.seriesTotales,
        pesoTotalRegistrado: resumenGlobal.pesoTotalRegistrado,
        sensacionesFaciles: resumenGlobal.faciles,
        sensacionesDificiles: resumenGlobal.dificiles,
      }
    : null;

  const resumenPorGrupoVisual = resumenPorGrupo.map((grupo) => ({
    grupo: grupo.grupoMuscular,
    apariciones: grupo.aparicionesTotales,
    cumplimiento: grupo.cumplimientoMedio * 100,
    ratioSeries: grupo.ratioSeriesMedio,
    sensacionDominante: grupo.sensacionDominante ?? "-",
  }));

  const resumenPorEjercicioVisual = resumenPorEjercicio.map((ejercicio) => ({
    ejercicio: ejercicio.nombreEjercicio,
    grupo: ejercicio.grupoMuscular,
    apariciones: ejercicio.apariciones,
    cumplimiento: ejercicio.cumplimiento * 100,
    ratioSeries: ejercicio.ratioSeries,
    pesoMedio: ejercicio.pesoMedio,
    dolorMedio: ejercicio.dolorMedio,
    fatigaMedia: ejercicio.fatigaMedia,
    descansoRecomendadoMedio: ejercicio.descansoRecomendadoMedio,
    descansoRealMedio: ejercicio.descansoRealMedio,
    ratioDescanso: ejercicio.ratioDescanso,
    estado: formatearEstado(ejercicio.estado),
  }));

  const diagnosticoProgreso = obtenerDiagnosticoProgreso(
    resumenGlobal,
    resumenPorEjercicio,
  );

  return (
    <ContenedorApp ancho="normal">
      <CabeceraPagina
        titulo="Progreso"
        descripcion="Consulta el estado general del entrenamiento, evolución histórica, rendimiento por grupo muscular y señales de dolor o fatiga."
        acciones={
          <div className="flex flex-wrap gap-3">
            <Link href="/entrenamiento" className={estilos.boton.primario}>
              Registrar sesión
            </Link>

            <Link href="/rutina" className={estilos.boton.secundario}>
              Ver rutina
            </Link>
          </div>
        }
      />

      {!resumenGlobal ? (
        <EstadoVacioProgreso />
      ) : (
        <>
          <PanelDiagnostico diagnostico={diagnosticoProgreso} />

          <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
            <TarjetaMetrica
              label="Sesiones"
              valor={resumenGlobal.sesionesTotales}
              descripcion="Entrenamientos guardados."
              tipo="info"
            />

            <TarjetaMetrica
              label="Ejercicios"
              valor={resumenGlobal.ejerciciosTotales}
              descripcion="Ejercicios registrados."
              tipo="base"
            />

            <TarjetaMetrica
              label="Series"
              valor={resumenGlobal.seriesTotales}
              descripcion="Volumen real registrado."
              tipo="base"
            />

            <TarjetaMetrica
              label="Peso total"
              valor={resumenGlobal.pesoTotalRegistrado}
              descripcion="Suma de cargas introducidas."
              tipo="ok"
            />

            <TarjetaMetrica
              label="Fáciles"
              valor={resumenGlobal.faciles}
              descripcion="Registros con sensación fácil."
              tipo="ok"
            />

            <TarjetaMetrica
              label="Difíciles"
              valor={resumenGlobal.dificiles}
              descripcion="Registros con sensación difícil."
              tipo={resumenGlobal.dificiles > resumenGlobal.faciles ? "aviso" : "base"}
            />
          </section>

          <PanelGraficasHistoricas evolucion={evolucionProgreso} />

          <PanelProgresoVisual
            resumenGlobal={resumenGlobalVisual}
            resumenPorGrupo={resumenPorGrupoVisual}
            resumenPorEjercicio={resumenPorEjercicioVisual}
          />

          <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <article className={estilos.tarjeta.base}>
              <div className="mb-6">
                <p className={estilos.texto.etiquetaVerde}>Grupos musculares</p>

                <h2 className="mt-2 text-2xl font-black text-slate-950">
                  Resumen por grupo muscular
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Compara apariciones, cumplimiento, ratio de series y sensación
                  dominante por zona muscular.
                </p>
              </div>

              {resumenPorGrupo.length === 0 ? (
                <p className="text-sm text-slate-500">
                  Todavía no hay datos por grupo muscular.
                </p>
              ) : (
                <div className="space-y-3">
                  {resumenPorGrupo.map((grupo) => (
                    <article
                      key={grupo.grupoMuscular}
                      className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5"
                    >
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div>
                          <p className="text-lg font-black capitalize text-slate-950">
                            {grupo.grupoMuscular}
                          </p>

                          <p className="mt-1 text-sm text-slate-600">
                            {grupo.aparicionesTotales} apariciones ·{" "}
                            {grupo.sensacionDominante ?? "sin sensación"}
                          </p>
                        </div>

                        <span className={estilos.badge.activo}>
                          {formatearPorcentaje(grupo.cumplimientoMedio)}
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="rounded-2xl border border-slate-200 bg-white p-4">
                          <p className="text-xs text-slate-500">
                            Ratio series
                          </p>
                          <p className="mt-1 font-black text-slate-950">
                            {grupo.ratioSeriesMedio.toFixed(2)}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-4">
                          <p className="text-xs text-slate-500">Sensación</p>
                          <p className="mt-1 font-black text-slate-950">
                            {grupo.sensacionDominante ?? "-"}
                          </p>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </article>

            <article className={estilos.tarjeta.base}>
              <div className="mb-6">
                <p className={estilos.texto.etiquetaVerde}>Historial reciente</p>

                <h2 className="mt-2 text-2xl font-black text-slate-950">
                  Últimas sesiones
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Revisión rápida de las últimas sesiones registradas.
                </p>
              </div>

              {ultimasSesiones.length === 0 ? (
                <p className="text-sm text-slate-500">
                  Todavía no hay sesiones registradas.
                </p>
              ) : (
                <div className="space-y-3">
                  {ultimasSesiones.map((sesion) => (
                    <article
                      key={sesion.id}
                      className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5"
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <p className="text-lg font-black text-slate-950">
                            {sesion.titulo_dia}
                          </p>

                          <p className="mt-1 text-sm text-slate-600">
                            Fecha: {sesion.fecha}
                          </p>
                        </div>

                        <span className={estilos.badge.info}>Guardada</span>
                      </div>

                      <p className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-600">
                        {sesion.nota_sesion ?? "Sin nota de sesión."}
                      </p>
                    </article>
                  ))}
                </div>
              )}
            </article>
          </section>

          <section className={estilos.tarjeta.base}>
            <div className="mb-6">
              <p className={estilos.texto.etiquetaVerde}>Ejercicios</p>

              <h2 className="mt-2 text-2xl font-black text-slate-950">
                Resumen por ejercicio
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Vista detallada de cumplimiento, carga, dolor, fatiga, descanso
                y estado interpretado por ejercicio.
              </p>
            </div>

            {resumenPorEjercicio.length === 0 ? (
              <p className="text-sm text-slate-500">
                Todavía no hay suficientes datos por ejercicio.
              </p>
            ) : (
              <div className="space-y-3">
                {resumenPorEjercicio.map((ejercicio) => (
                  <article
                    key={ejercicio.ejercicioId}
                    className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5"
                  >
                    <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="text-lg font-black text-slate-950">
                          {ejercicio.nombreEjercicio}
                        </p>

                        <p className="mt-1 text-sm capitalize text-slate-600">
                          {ejercicio.grupoMuscular} · {ejercicio.apariciones}{" "}
                          apariciones
                        </p>
                      </div>

                      <span
                        className={unirClases(
                          "rounded-full border px-3 py-1 text-xs font-black",
                          obtenerClaseEstado(ejercicio.estado),
                        )}
                      >
                        {formatearEstado(ejercicio.estado)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
                      <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <p className="text-xs text-slate-500">Cumplimiento</p>
                        <p className="mt-1 font-black text-slate-950">
                          {formatearPorcentaje(ejercicio.cumplimiento)}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <p className="text-xs text-slate-500">Ratio series</p>
                        <p className="mt-1 font-black text-slate-950">
                          {ejercicio.ratioSeries.toFixed(2)}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <p className="text-xs text-slate-500">Peso medio</p>
                        <p className="mt-1 font-black text-slate-950">
                          {ejercicio.pesoMedio ?? "-"}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <p className="text-xs text-slate-500">Dolor medio</p>
                        <p className="mt-1 font-black text-slate-950">
                          {formatearNumero(ejercicio.dolorMedio)}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <p className="text-xs text-slate-500">Fatiga media</p>
                        <p className="mt-1 font-black text-slate-950">
                          {formatearNumero(ejercicio.fatigaMedia)}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <p className="text-xs text-slate-500">
                          Ratio descanso
                        </p>
                        <p className="mt-1 font-black text-slate-950">
                          {formatearNumero(ejercicio.ratioDescanso, 2)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <p className="text-xs text-slate-500">
                          Descanso recomendado medio
                        </p>
                        <p className="mt-1 font-black text-slate-950">
                          {formatearSegundos(
                            ejercicio.descansoRecomendadoMedio,
                          )}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <p className="text-xs text-slate-500">
                          Descanso real medio
                        </p>
                        <p className="mt-1 font-black text-slate-950">
                          {formatearSegundos(ejercicio.descansoRealMedio)}
                        </p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </ContenedorApp>
  );
}