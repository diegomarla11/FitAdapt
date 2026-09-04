import Link from "next/link";
import Image from "next/image";
import { crearClienteSupabaseServer } from "@/lib/supabase/server";
import { parsearTextoLista } from "@/lib/ejercicios/parsearTextoLista";
import CabeceraPagina from "@/componentes/cabeceraPagina";
import type { Ejercicio } from "@/tipos/ejercicio";
import { obtenerUsuarioActual } from "@/lib/auth/obtenerUsuarioActual";
import ContenedorApp from "@/componentes/contenedorApp";
import { estilos, unirClases } from "@/lib/ui/estilos";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

type RegistroHistorial = {
  id: string;
  created_at: string;
  series_reales: number | null;
  repeticiones_reales: string | null;
  peso_usado: number | null;
  sensacion: "facil" | "bien" | "dificil" | null;
  estado_resultado: "completado" | "parcial" | "superado" | null;
  nivel_dolor: number | null;
  fatiga: number | null;
  descanso_recomendado: number | null;
  descanso_real: number | null;
  motivo_parcial: string | null;
  sesiones_entrenamiento?:
    | {
        fecha: string;
        titulo_dia: string;
      }
    | {
        fecha: string;
        titulo_dia: string;
      }[]
    | null;
};

function formatearSensacion(sensacion: string | null) {
  if (sensacion === "facil") return "Fácil";
  if (sensacion === "bien") return "Bien";
  if (sensacion === "dificil") return "Difícil";
  return "No indicada";
}

function formatearEstadoResultado(estado: string | null) {
  if (estado === "completado") {
    return "Completado";
  }

  if (estado === "parcial") {
    return "Por debajo";
  }

  if (estado === "superado") {
    return "Por encima";
  }

  return "No indicado";
}

function formatearEscala(valor: number | null) {
  if (valor === null || !Number.isFinite(valor)) {
    return "-";
  }

  return `${valor}/10`;
}

function formatearDescanso(valor: number | null) {
  if (valor === null || !Number.isFinite(valor)) {
    return "-";
  }

  return `${Math.round(valor)} s`;
}

function obtenerSesionHistorial(
  sesiones:
    | {
        fecha: string;
        titulo_dia: string;
      }
    | {
        fecha: string;
        titulo_dia: string;
      }[]
    | null
    | undefined,
) {
  if (!sesiones) {
    return null;
  }

  if (Array.isArray(sesiones)) {
    return sesiones[0] ?? null;
  }

  return sesiones;
}

function obtenerLecturaHistorial(historial: RegistroHistorial[]) {
  if (historial.length === 0) {
    return {
      tipo: "info" as const,
      titulo: "Sin historial suficiente",
      descripcion:
        "Todavía no hay datos de entrenamiento para interpretar la evolución de este ejercicio.",
    };
  }

  const ultimoRegistro = historial[0];

  if ((ultimoRegistro.nivel_dolor ?? 0) >= 4) {
    return {
      tipo: "error" as const,
      titulo: "Dolor registrado recientemente",
      descripcion:
        "En el último registro aparece dolor relevante. Conviene evitar progresar en este ejercicio y valorar una variante menos conflictiva.",
    };
  }

  if ((ultimoRegistro.fatiga ?? 0) >= 8) {
    return {
      tipo: "aviso" as const,
      titulo: "Fatiga elevada recientemente",
      descripcion:
        "En el último registro aparece fatiga alta. Conviene mantener o reducir la exigencia antes de volver a progresar.",
    };
  }

  if (
    ultimoRegistro.descanso_recomendado &&
    ultimoRegistro.descanso_real &&
    ultimoRegistro.descanso_real / ultimoRegistro.descanso_recomendado >= 1.5
  ) {
    return {
      tipo: "aviso" as const,
      titulo: "Descanso real elevado",
      descripcion:
        "El último registro necesitó bastante más descanso del recomendado. Esto puede indicar fatiga o una exigencia demasiado alta.",
    };
  }

  if (ultimoRegistro.estado_resultado === "superado") {
    return {
      tipo: "ok" as const,
      titulo: "Buen rendimiento reciente",
      descripcion:
        "En el último registro superaste lo previsto. Este ejercicio podría admitir una progresión suave si la técnica se mantiene correcta.",
    };
  }

  if (ultimoRegistro.estado_resultado === "parcial") {
    return {
      tipo: "aviso" as const,
      titulo: "Rendimiento por debajo de lo previsto",
      descripcion:
        "En el último registro no se alcanzó completamente lo planificado. Conviene mantener o reducir la exigencia antes de progresar.",
    };
  }

  if (ultimoRegistro.sensacion === "dificil") {
    return {
      tipo: "aviso" as const,
      titulo: "Ejercicio exigente recientemente",
      descripcion:
        "La última sensación registrada fue difícil. Prioriza la ejecución técnica y evita aumentar la carga demasiado pronto.",
    };
  }

  if (ultimoRegistro.sensacion === "facil") {
    return {
      tipo: "ok" as const,
      titulo: "Ejercicio asimilado correctamente",
      descripcion:
        "La última sensación registrada fue fácil. Puedes valorar aumentar ligeramente la carga, las repeticiones o mantener una ejecución más controlada.",
    };
  }

  return {
    tipo: "info" as const,
    titulo: "Rendimiento estable",
    descripcion:
      "El historial reciente muestra una ejecución estable. Puedes repetir una carga similar y seguir registrando datos.",
  };
}

function obtenerClaseLectura(tipo: "ok" | "info" | "aviso" | "error") {
  if (tipo === "ok") {
    return "border-lime-200 bg-lime-50 text-lime-950";
  }

  if (tipo === "aviso") {
    return "border-amber-200 bg-amber-50 text-amber-950";
  }

  if (tipo === "error") {
    return "border-red-200 bg-red-50 text-red-950";
  }

  return "border-blue-200 bg-blue-50 text-blue-950";
}

function obtenerClaseResultado(estado: string | null) {
  if (estado === "completado") {
    return estilos.badge.activo;
  }

  if (estado === "parcial") {
    return estilos.badge.aviso;
  }

  if (estado === "superado") {
    return estilos.badge.info;
  }

  return estilos.badge.base;
}

function SeccionTecnica({
  titulo,
  items,
  vacio,
}: {
  titulo: string;
  items: string[];
  vacio: string;
}) {
  return (
    <article className={estilos.tarjeta.base}>
      <p className={estilos.texto.etiquetaVerde}>Técnica</p>

      <h2 className="mt-2 text-2xl font-black text-slate-950">{titulo}</h2>

      {items.length > 0 ? (
        <ul className="mt-5 space-y-3 text-sm leading-6 text-slate-700">
          {items.map((item, index) => (
            <li key={index} className="flex gap-3">
              <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-lime-400" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm leading-6 text-slate-500">{vacio}</p>
      )}
    </article>
  );
}

function TarjetaDatoTecnico({
  label,
  valor,
}: {
  label: string;
  valor: string | number;
}) {
  return (
    <article className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-medium text-slate-500">{label}</p>

      <p className="mt-2 text-sm font-black capitalize text-slate-950">
        {valor}
      </p>
    </article>
  );
}

function TarjetaHistorial({
  label,
  valor,
}: {
  label: string;
  valor: string | number;
}) {
  return (
    <article className={estilos.tarjeta.metrica}>
      <p className="text-sm font-medium text-slate-500">{label}</p>

      <p className="mt-2 text-2xl font-black tracking-tight text-slate-950">
        {valor}
      </p>
    </article>
  );
}

export default async function PaginaDetalleEjercicio({ params }: Props) {
  const { id } = await params;

  const supabase = await crearClienteSupabaseServer();
  const user = await obtenerUsuarioActual();

  const { data: ejercicioData, error } = await supabase
    .from("ejercicios")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  const ejercicio = ejercicioData as Ejercicio | null;

  if (error || !ejercicio) {
    return (
      <ContenedorApp ancho="detalle">
        <CabeceraPagina
          titulo="Ejercicio no encontrado"
          descripcion="No se ha podido cargar la ficha solicitada."
          acciones={
            <Link href="/ejercicios" className={estilos.boton.secundario}>
              Volver a ejercicios
            </Link>
          }
        />

        <section className={estilos.tarjeta.error}>
          <p className="text-sm font-bold leading-6 text-red-900">
            No se ha podido cargar el detalle del ejercicio.
          </p>
        </section>
      </ContenedorApp>
    );
  }

  let historial: RegistroHistorial[] = [];

  if (user) {
    const { data: sesionesUsuario, error: errorSesiones } = await supabase
      .from("sesiones_entrenamiento")
      .select("id")
      .eq("user_id", user.id);

    if (!errorSesiones && sesionesUsuario && sesionesUsuario.length > 0) {
      const idsSesiones = sesionesUsuario.map((sesion) => sesion.id);

      const { data: historialData } = await supabase
        .from("sesion_ejercicios")
        .select(
          `
  id,
  created_at,
  series_reales,
  repeticiones_reales,
  peso_usado,
  sensacion,
  estado_resultado,
  nivel_dolor,
  fatiga,
  descanso_recomendado,
  descanso_real,
  motivo_parcial,
  sesiones_entrenamiento (
    fecha,
    titulo_dia
  )
`,
        )
        .eq("ejercicio_id", id)
        .eq("completado", true)
        .in("sesion_id", idsSesiones)
        .order("created_at", { ascending: false })
        .limit(8);

      historial = historialData ?? [];
    }
  }

  const instrucciones = parsearTextoLista(ejercicio.instrucciones);
  const erroresComunes = parsearTextoLista(ejercicio.errores_comunes);
  const ajustes = parsearTextoLista(ejercicio.ajustes);
  const recomendaciones = parsearTextoLista(ejercicio.recomendaciones_nivel);
  const variantes = parsearTextoLista(ejercicio.variantes);
  const contraindicaciones = parsearTextoLista(ejercicio.contraindicaciones);

  const vecesRealizado = historial.length;
  const ultimoPeso =
    historial.find((item) => item.peso_usado !== null)?.peso_usado ?? "-";
  const ultimasSeries =
    historial.find((item) => item.series_reales !== null)?.series_reales ?? "-";
  const ultimaSensacion =
    historial.find((item) => item.sensacion)?.sensacion ?? null;
  const ultimoDolor =
    historial.find((item) => item.nivel_dolor !== null)?.nivel_dolor ?? null;
  const ultimaFatiga =
    historial.find((item) => item.fatiga !== null)?.fatiga ?? null;
  const ultimoDescansoReal =
    historial.find((item) => item.descanso_real !== null)?.descanso_real ??
    null;

  const lecturaHistorial = obtenerLecturaHistorial(historial);

  return (
    <ContenedorApp ancho="detalle">
      <CabeceraPagina
        titulo="Detalle del ejercicio"
        descripcion="Consulta la técnica, recomendaciones, compatibilidad e historial reciente."
        acciones={
          <div className="flex flex-wrap gap-3">
            <Link href="/ejercicios" className={estilos.boton.secundario}>
              Volver a ejercicios
            </Link>

            <Link href="/rutina" className={estilos.boton.primario}>
              Ver rutina
            </Link>
          </div>
        }
      />

      <section className={estilos.tarjeta.base}>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className={estilos.texto.etiquetaVerde}>Ficha técnica</p>

            <h2 className="mt-2 text-4xl font-black tracking-tight text-slate-950">
              {ejercicio.nombre}
            </h2>

            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              {ejercicio.descripcion ?? "Ficha técnica del ejercicio."}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 lg:justify-end">
            <span className={estilos.badge.activo}>
              {ejercicio.grupo_muscular}
            </span>

            <span className={estilos.badge.base}>
              {ejercicio.patron_movimiento ?? "Patrón no indicado"}
            </span>

            <span className={estilos.badge.base}>
              {ejercicio.dificultad ?? "Dificultad no indicada"}
            </span>
          </div>
        </div>

        {ejercicio.imagen_url && (
          <section className="mt-6 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
            <div className="relative h-[360px] w-full overflow-hidden rounded-[1.25rem] border border-slate-200 bg-white">
              <Image
                src={ejercicio.imagen_url}
                alt={`Demostración del ejercicio ${ejercicio.nombre}`}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 960px"
                className="object-contain"
              />
            </div>
          </section>
        )}

        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          <TarjetaDatoTecnico
            label="Grupo"
            valor={ejercicio.grupo_muscular}
          />

          <TarjetaDatoTecnico
            label="Patrón"
            valor={ejercicio.patron_movimiento ?? "No indicado"}
          />

          <TarjetaDatoTecnico
            label="Equipamiento"
            valor={ejercicio.equipamiento ?? "No indicado"}
          />

          <TarjetaDatoTecnico
            label="Dificultad"
            valor={ejercicio.dificultad ?? "No indicada"}
          />
        </div>
      </section>

      <section className={estilos.tarjeta.destacada}>
        <div className="mb-5">
          <p className={estilos.texto.etiquetaVerde}>Lectura rápida</p>

          <h2 className="mt-2 text-2xl font-black text-slate-950">
            Cómo usar esta ficha
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-lime-200 bg-white p-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-lime-700">
              Técnica
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              Revisa primero instrucciones y ajustes antes de aumentar carga.
            </p>
          </div>

          <div className="rounded-2xl border border-lime-200 bg-white p-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-lime-700">
              Progresión
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              Usa el historial reciente para decidir si mantener, subir o
              reducir.
            </p>
          </div>

          <div className="rounded-2xl border border-lime-200 bg-white p-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-lime-700">
              Seguridad
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              Si aparece dolor o fatiga alta, prioriza una variante más cómoda.
            </p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SeccionTecnica
          titulo="Instrucciones"
          items={instrucciones}
          vacio="Sin instrucciones detalladas todavía."
        />

        <SeccionTecnica
          titulo="Ajustes y colocación"
          items={ajustes}
          vacio="Sin ajustes específicos registrados."
        />

        <SeccionTecnica
          titulo="Errores comunes"
          items={erroresComunes}
          vacio="Sin errores comunes registrados."
        />

        <SeccionTecnica
          titulo="Recomendaciones por nivel"
          items={recomendaciones}
          vacio="Sin recomendaciones registradas."
        />

        <SeccionTecnica
          titulo="Variantes y alternativas"
          items={variantes}
          vacio="Sin variantes registradas."
        />

        <SeccionTecnica
          titulo="Contraindicaciones"
          items={contraindicaciones}
          vacio="Sin contraindicaciones registradas."
        />
      </section>

      <section className={estilos.tarjeta.base}>
        <div className="mb-6">
          <p className={estilos.texto.etiquetaVerde}>Historial</p>

          <h2 className="mt-2 text-3xl font-black text-slate-950">
            Historial reciente
          </h2>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Revisa cómo ha respondido este ejercicio en sesiones anteriores:
            series, repeticiones, peso, sensación, dolor, fatiga y descanso.
          </p>
        </div>

        {historial.length > 0 ? (
          <div className="space-y-5">
            <div
              className={unirClases(
                "rounded-[1.5rem] border p-5",
                obtenerClaseLectura(lecturaHistorial.tipo),
              )}
            >
              <p className="text-xs font-black uppercase tracking-[0.16em] opacity-80">
                Lectura automática
              </p>

              <h3 className="mt-2 text-2xl font-black">
                {lecturaHistorial.titulo}
              </h3>

              <p className="mt-2 text-sm leading-6">
                {lecturaHistorial.descripcion}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <TarjetaHistorial
                label="Veces realizado"
                valor={vecesRealizado}
              />

              <TarjetaHistorial label="Último peso" valor={ultimoPeso} />

              <TarjetaHistorial
                label="Últimas series"
                valor={ultimasSeries}
              />

              <TarjetaHistorial
                label="Última sensación"
                valor={formatearSensacion(ultimaSensacion)}
              />

              <TarjetaHistorial
                label="Último dolor"
                valor={formatearEscala(ultimoDolor)}
              />

              <TarjetaHistorial
                label="Última fatiga"
                valor={formatearEscala(ultimaFatiga)}
              />

              <TarjetaHistorial
                label="Último descanso"
                valor={formatearDescanso(ultimoDescansoReal)}
              />
            </div>

            <details className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
              <summary className="cursor-pointer list-none text-sm font-black uppercase tracking-[0.16em] text-slate-600">
                Ver registros recientes
              </summary>

              <div className="mt-5 space-y-3">
                {historial.map((registro) => {
                  const sesion = obtenerSesionHistorial(
                    registro.sesiones_entrenamiento,
                  );

                  return (
                    <article
                      key={registro.id}
                      className="rounded-[1.5rem] border border-slate-200 bg-white p-5"
                    >
                      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <p className="text-lg font-black text-slate-950">
                            {sesion?.titulo_dia ?? "Sesión registrada"}
                          </p>

                          <p className="mt-1 text-sm text-slate-600">
                            {sesion?.fecha ??
                              registro.created_at?.slice(0, 10) ??
                              "-"}
                          </p>
                        </div>

                        <span
                          className={obtenerClaseResultado(
                            registro.estado_resultado,
                          )}
                        >
                          {formatearEstadoResultado(
                            registro.estado_resultado,
                          )}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                        <TarjetaDatoTecnico
                          label="Series / reps"
                          valor={`${registro.series_reales ?? "-"} / ${
                            registro.repeticiones_reales ?? "-"
                          }`}
                        />

                        <TarjetaDatoTecnico
                          label="Peso"
                          valor={registro.peso_usado ?? "-"}
                        />

                        <TarjetaDatoTecnico
                          label="Sensación"
                          valor={formatearSensacion(registro.sensacion ?? null)}
                        />

                        <TarjetaDatoTecnico
                          label="Dolor / fatiga"
                          valor={`${formatearEscala(
                            registro.nivel_dolor,
                          )} / ${formatearEscala(registro.fatiga)}`}
                        />

                        <TarjetaDatoTecnico
                          label="Descanso real"
                          valor={formatearDescanso(registro.descanso_real)}
                        />

                        <TarjetaDatoTecnico
                          label="Descanso recomendado"
                          valor={formatearDescanso(
                            registro.descanso_recomendado,
                          )}
                        />
                      </div>

                      {registro.motivo_parcial && (
                        <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                          {registro.motivo_parcial}
                        </p>
                      )}
                    </article>
                  );
                })}
              </div>
            </details>
          </div>
        ) : (
          <p className="text-sm leading-6 text-slate-500">
            Todavía no hay historial reciente de este ejercicio.
          </p>
        )}
      </section>
    </ContenedorApp>
  );
}