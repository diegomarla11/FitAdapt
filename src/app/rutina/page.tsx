import Link from "next/link";
import { crearClienteSupabaseServer } from "@/lib/supabase/server";
import { generarRutinaBasica } from "@/lib/rutina/generadorRutina";
import {
  obtenerUltimaRutinaGuardada,
  obtenerUltimoPerfil,
} from "@/lib/rutina/obtenerUltimaRutina";
import { transformarRutinaGuardada } from "@/lib/rutina/transformarRutinaGuardada";
import type { Perfil } from "@/tipos/perfil";
import type { Ejercicio } from "@/tipos/ejercicio";
import type { RutinaGenerada } from "@/tipos/rutina";
import { obtenerSiguienteIndiceRotacion } from "@/lib/rutina/obtenerIndiceRotacion";
import RutinaEditable from "@/componentes/rutinaEditable";
import { comprobarRutinaDesactualizada } from "@/lib/rutina/comprobarRutinaDesactualizada";
import CabeceraPagina from "@/componentes/cabeceraPagina";
import { obtenerUsuarioActual } from "@/lib/auth/obtenerUsuarioActual";
import ContenedorApp from "@/componentes/contenedorApp";
import { estilos } from "@/lib/ui/estilos";

type Props = {
  searchParams?: Promise<{
    modo?: string;
    rotacion?: string;
  }>;
};

function obtenerListaEquipamiento(equipoDisponible: string | null | undefined) {
  if (!equipoDisponible || !equipoDisponible.trim()) {
    return ["No indicado"];
  }

  return equipoDisponible
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function obtenerTextoMolestias(molestias: string | null | undefined) {
  if (!molestias || !molestias.trim() || molestias === "No indicadas") {
    return "No indicadas";
  }

  return molestias;
}

function normalizarTexto(valor: string | null | undefined) {
  return valor?.trim().toLowerCase() ?? "";
}

function capitalizar(valor: string | null | undefined) {
  if (!valor) {
    return "No indicado";
  }

  return valor.charAt(0).toUpperCase() + valor.slice(1);
}

function obtenerDescripcionObjetivo(objetivo: string) {
  const objetivoNormalizado = normalizarTexto(objetivo);

  if (objetivoNormalizado === "fuerza") {
    return "Prioriza rangos de repeticiones más bajos, descansos amplios y ejercicios principales.";
  }

  if (objetivoNormalizado === "hipertrofia") {
    return "Prioriza rangos medios y altos de repeticiones para acumular volumen de trabajo.";
  }

  if (objetivoNormalizado === "mantenimiento") {
    return "Reduce ligeramente el volumen para mantener estímulo sin generar carga excesiva.";
  }

  if (
    objetivoNormalizado === "recomposicion" ||
    objetivoNormalizado === "recomposición"
  ) {
    return "Usa un volumen moderado para equilibrar estímulo muscular y recuperación.";
  }

  return "El objetivo se usa para ajustar volumen, repeticiones y tipo de estímulo.";
}

function obtenerDescripcionNivel(nivel: string) {
  const nivelNormalizado = normalizarTexto(nivel);

  if (nivelNormalizado === "principiante") {
    return "Prioriza ejercicios sencillos, técnica clara y volumen controlado.";
  }

  if (nivelNormalizado === "avanzado") {
    return "Permite ejercicios más exigentes, más volumen y variantes complejas.";
  }

  return "Usa ejercicios y volúmenes intermedios con progresión equilibrada.";
}

function obtenerDescripcionDuracion(duracionSesion: number) {
  if (duracionSesion <= 30) {
    return "Sesión corta: se priorizan ejercicios principales y se reducen accesorios.";
  }

  if (duracionSesion <= 60) {
    return "Sesión estándar: equilibrio entre ejercicios principales y accesorios.";
  }

  return "Sesión amplia: permite conservar más volumen y más ejercicios accesorios.";
}

function TarjetaResumenRutina({
  label,
  valor,
  ayuda,
}: {
  label: string;
  valor: string | number;
  ayuda: string;
}) {
  return (
    <article className={estilos.tarjeta.metrica}>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-xl font-black text-slate-950">{valor}</p>
      <p className="mt-2 text-xs leading-5 text-slate-500">{ayuda}</p>
    </article>
  );
}

function AvisoRutinaDesactualizada() {
  return (
    <section className={estilos.tarjeta.aviso}>
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-800">
            Revisión recomendada
          </p>

          <h2 className="mt-2 text-2xl font-black text-amber-950">
            Esta rutina puede estar desactualizada
          </h2>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-amber-900">
            El perfil ha cambiado desde que se guardó esta rutina. Puedes
            revisarla, editarla o regenerarla para que vuelva a coincidir con
            tu objetivo, nivel, equipamiento, duración y molestias.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link href="/perfil" className={estilos.boton.secundario}>
            Revisar perfil
          </Link>

          <Link href="/rutina?modo=nueva" className={estilos.boton.primario}>
            Regenerar rutina
          </Link>
        </div>
      </div>
    </section>
  );
}

function AvisoRutinaPendienteGuardar() {
  return (
    <section className="rounded-[1.75rem] border border-amber-300 bg-amber-50 p-5 shadow-sm md:p-6">
      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-800">
            Rutina pendiente de guardar
          </p>

          <h2 className="mt-2 text-2xl font-black text-amber-950">
            Esta propuesta todavía no está activa
          </h2>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-amber-900">
            Revisa los ejercicios, aplica los ajustes que necesites y pulsa
            “Guardar rutina” para que FitAdapt la use en la pantalla de
            entrenamiento.
          </p>
        </div>

        <div className="rounded-2xl border border-amber-300 bg-white px-4 py-3 text-sm font-black text-amber-900">
          Sin guardar
        </div>
      </div>
    </section>
  );
}

function PanelAdaptacion({
  perfil,
  indiceRotacion,
  modo,
}: {
  perfil: Perfil;
  indiceRotacion: number;
  modo: "guardada" | "generada";
}) {
  const equipamiento = obtenerListaEquipamiento(perfil.equipo_disponible);
  const molestias = obtenerTextoMolestias(perfil.molestias);

  return (
    <section className={estilos.tarjeta.base}>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className={estilos.texto.etiquetaVerde}>
            Sistema de adaptación
          </p>

          <h2 className="mt-2 text-3xl font-black text-slate-950">
            Contexto usado para crear la rutina
          </h2>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            La rutina se construye usando objetivo, nivel, duración disponible,
            equipamiento, molestias, rotación de ejercicios y datos previos de
            progreso.
          </p>
        </div>

        <span
          className={
            modo === "guardada" ? estilos.badge.activo : estilos.badge.info
          }
        >
          {modo === "guardada" ? "Rutina guardada" : "Rutina generada"}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <TarjetaResumenRutina
          label="Objetivo"
          valor={capitalizar(perfil.objetivo)}
          ayuda={obtenerDescripcionObjetivo(perfil.objetivo)}
        />

        <TarjetaResumenRutina
          label="Nivel"
          valor={capitalizar(perfil.nivel)}
          ayuda={obtenerDescripcionNivel(perfil.nivel)}
        />

        <TarjetaResumenRutina
          label="Frecuencia"
          valor={`${perfil.dias_por_semana} días`}
          ayuda="Define la división semanal y el número de bloques de entrenamiento."
        />

        <TarjetaResumenRutina
          label="Duración"
          valor={`${perfil.duracion_sesion} min`}
          ayuda={obtenerDescripcionDuracion(perfil.duracion_sesion)}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
          <p className="text-sm font-bold text-slate-700">
            Equipamiento disponible
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {equipamiento.map((item) => (
              <span key={item} className={estilos.badge.base}>
                {item}
              </span>
            ))}
          </div>
        </article>

        <article className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
          <p className="text-sm font-bold text-slate-700">
            Molestias consideradas
          </p>

          <p className="mt-3 text-sm leading-6 text-slate-600">{molestias}</p>
        </article>
      </div>

      <div className="mt-4 rounded-[1.5rem] border border-blue-200 bg-blue-50 p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.16em] text-blue-800">
              Rotación de ejercicios
            </p>

            <p className="mt-2 text-sm leading-6 text-blue-950">
              Índice de rotación actual:{" "}
              <span className="font-black">{indiceRotacion}</span>. Este dato
              ayuda a evitar que siempre se generen exactamente las mismas
              variantes cuando existan alternativas compatibles.
            </p>
          </div>

          <Link href="/ejercicios" className={estilos.boton.secundario}>
            Ver biblioteca
          </Link>
        </div>
      </div>
    </section>
  );
}

function PanelEstadoRutina({
  rutina,
  modo,
  rutinaDesactualizada,
}: {
  rutina: RutinaGenerada;
  modo: "guardada" | "generada";
  rutinaDesactualizada?: boolean;
}) {
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

  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <TarjetaResumenRutina
        label="Estado"
        valor={
          rutinaDesactualizada
            ? "Revisar"
            : modo === "guardada"
              ? "Guardada"
              : "Generada"
        }
        ayuda={
          rutinaDesactualizada
            ? "El perfil ha cambiado y conviene regenerar."
            : modo === "guardada"
              ? "Lista para editar o entrenar."
              : "Pendiente de revisar y guardar."
        }
      />

      <TarjetaResumenRutina
        label="Días"
        valor={rutina.dias.length}
        ayuda="Bloques de entrenamiento planificados."
      />

      <TarjetaResumenRutina
        label="Ejercicios"
        valor={totalEjercicios}
        ayuda="Ejercicios incluidos en toda la rutina."
      />

      <TarjetaResumenRutina
        label="Series"
        valor={totalSeries}
        ayuda="Volumen total planificado."
      />
    </section>
  );
}

function MensajeEstado({
  titulo,
  descripcion,
  accion,
}: {
  titulo: string;
  descripcion: string;
  accion?: React.ReactNode;
}) {
  return (
    <section className={estilos.tarjeta.base}>
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className={estilos.texto.etiquetaVerde}>Estado de rutina</p>

          <h2 className="mt-2 text-2xl font-black text-slate-950">{titulo}</h2>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            {descripcion}
          </p>
        </div>

        {accion && <div className="flex flex-wrap gap-3">{accion}</div>}
      </div>
    </section>
  );
}

export const dynamic = "force-dynamic";

export default async function PaginaRutina({ searchParams }: Props) {
  await obtenerUsuarioActual();

  const params = searchParams ? await searchParams : {};
  const modo = params?.modo;
  const rotacionDesdeUrl = Number(params?.rotacion ?? "");

  const perfil = (await obtenerUltimoPerfil()) as Perfil | null;
  const supabase = await crearClienteSupabaseServer();

  const { data: ejercicios, error: errorEjercicios } = await supabase
    .from("ejercicios")
    .select("*")
    .order("nombre", { ascending: true });

  if (errorEjercicios) {
    return (
      <ContenedorApp ancho="normal">
        <CabeceraPagina
          titulo="Rutina"
          descripcion="Genera, revisa y edita tu rutina personalizada."
        />

        <MensajeEstado
          titulo="No se han podido cargar los ejercicios"
          descripcion="Ha ocurrido un error al consultar la base de datos de ejercicios. Revisa la conexión con Supabase o vuelve a intentarlo."
        />
      </ContenedorApp>
    );
  }

  const listaEjercicios: Ejercicio[] = ejercicios ?? [];

  if (!perfil) {
    return (
      <ContenedorApp ancho="normal">
        <CabeceraPagina
          titulo="Rutina"
          descripcion="Genera, revisa y edita tu rutina personalizada."
          acciones={
            <Link href="/onboarding" className={estilos.boton.primario}>
              Completar onboarding
            </Link>
          }
        />

        <MensajeEstado
          titulo="No hay perfil guardado"
          descripcion="Completa primero la configuración inicial para que FitAdapt pueda generar una rutina adaptada a tu objetivo, nivel, disponibilidad, equipamiento y molestias."
          accion={
            <Link href="/onboarding" className={estilos.boton.primario}>
              Crear perfil
            </Link>
          }
        />
      </ContenedorApp>
    );
  }

  if (listaEjercicios.length === 0) {
    return (
      <ContenedorApp ancho="normal">
        <CabeceraPagina
          titulo="Rutina"
          descripcion="Genera, revisa y edita tu rutina personalizada."
        />

        <MensajeEstado
          titulo="No hay ejercicios disponibles"
          descripcion="La base de datos de ejercicios está vacía. Añade ejercicios antes de generar una rutina personalizada."
        />
      </ContenedorApp>
    );
  }

  if (modo !== "nueva") {
    const rutinaGuardada = await obtenerUltimaRutinaGuardada();

    if (rutinaGuardada) {
      const rutinaTransformada = transformarRutinaGuardada(
        rutinaGuardada.rutina,
        rutinaGuardada.ejercicios,
      );

      const rutinaDesactualizada = comprobarRutinaDesactualizada(
        perfil,
        rutinaGuardada.rutina,
      );

      return (
        <ContenedorApp ancho="normal">
          <CabeceraPagina
            titulo="Rutina personalizada"
            descripcion={`Plan guardado · ${capitalizar(
              rutinaTransformada.objetivo,
            )} · ${capitalizar(rutinaTransformada.nivel)} · ${rutinaTransformada.dias_por_semana
              } días por semana`}
            acciones={
              <>
                <Link
                  href="/rutina?modo=nueva"
                  className={estilos.boton.secundario}
                >
                  Regenerar rutina
                </Link>

                <Link href="/entrenamiento" className={estilos.boton.primario}>
                  Empezar entrenamiento
                </Link>
              </>
            }
          />

          {rutinaDesactualizada && <AvisoRutinaDesactualizada />}

          <PanelEstadoRutina
            rutina={rutinaTransformada}
            modo="guardada"
            rutinaDesactualizada={rutinaDesactualizada}
          />

          <PanelAdaptacion
            perfil={perfil}
            indiceRotacion={rutinaGuardada.rutina.indice_rotacion ?? 0}
            modo="guardada"
          />

          <section className={estilos.tarjeta.base}>
            <div className="mb-6">
              <p className={estilos.texto.etiquetaVerde}>
                Editor inteligente
              </p>

              <h2 className="mt-2 text-3xl font-black text-slate-950">
                Revisa, ajusta y guarda tu rutina
              </h2>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                Puedes modificar la rutina con texto, sustituir ejercicios
                incompatibles y guardar los cambios antes de entrenar.
              </p>
            </div>

            <RutinaEditable
              key={`rutina-guardada-${rutinaGuardada.rutina.id}`}
              rutinaInicial={rutinaTransformada}
              ejerciciosDisponibles={listaEjercicios}
              equipamientoDisponiblePerfil={perfil.equipo_disponible ?? null}
              molestiasPerfil={perfil.molestias ?? null}
              rutinaIdExistente={rutinaGuardada.rutina.id}
            />
          </section>
        </ContenedorApp>
      );
    }
  }

  const indiceRotacion =
    Number.isFinite(rotacionDesdeUrl) && rotacionDesdeUrl >= 0
      ? rotacionDesdeUrl
      : await obtenerSiguienteIndiceRotacion();

  const rutina = await generarRutinaBasica(
    perfil,
    listaEjercicios,
    indiceRotacion,
  );

  return (
    <ContenedorApp ancho="normal">
      <CabeceraPagina
        titulo="Rutina generada"
        descripcion={`Nueva propuesta pendiente de guardar · ${capitalizar(
          rutina.objetivo,
        )} · ${capitalizar(rutina.nivel)} · ${rutina.dias_por_semana
          } días por semana`}
        acciones={
          <>
            <Link href="/rutina?modo=nueva" className={estilos.boton.secundario}>
              Regenerar rutina
            </Link>

            <Link href="/inicio" className={estilos.boton.secundario}>
              Volver al inicio
            </Link>
          </>
        }
      />

      <AvisoRutinaPendienteGuardar />

      <PanelEstadoRutina rutina={rutina} modo="generada" />

      <PanelAdaptacion
        perfil={perfil}
        indiceRotacion={indiceRotacion}
        modo="generada"
      />

      <section className={estilos.tarjeta.base}>
        <div className="mb-6">
          <p className={estilos.texto.etiquetaVerde}>Editor inteligente</p>

          <h2 className="mt-2 text-3xl font-black text-slate-950">
            Revisa la propuesta antes de guardarla
          </h2>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Esta rutina todavía no está guardada. Puedes aplicar ajustes por
            texto, sustituir ejercicios y después guardar el plan final.
          </p>
        </div>

        <RutinaEditable
          key={`rutina-generada-${indiceRotacion}-${rutina.dias_por_semana}-${rutina.dias.length}`}
          rutinaInicial={rutina}
          ejerciciosDisponibles={listaEjercicios}
          equipamientoDisponiblePerfil={perfil.equipo_disponible ?? null}
          molestiasPerfil={perfil.molestias ?? null}
          rutinaIdExistente={null}
        />
      </section>
    </ContenedorApp>
  );
}