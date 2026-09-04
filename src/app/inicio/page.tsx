import Link from "next/link";
import { obtenerResumenInicio } from "@/lib/progreso/obtenerResumenInicio";
import { comprobarRutinaDesactualizada } from "@/lib/rutina/comprobarRutinaDesactualizada";
import { obtenerUsuarioActual } from "@/lib/auth/obtenerUsuarioActual";
import ContenedorApp from "@/componentes/contenedorApp";
import { estilos, unirClases } from "@/lib/ui/estilos";

export const dynamic = "force-dynamic";

function TarjetaDato({
  label,
  valor,
  destacado = false,
}: {
  label: string;
  valor: string | number;
  destacado?: boolean;
}) {
  return (
    <article
      className={unirClases(
        "rounded-[1.5rem] border p-5 shadow-sm",
        destacado
          ? "border-lime-200 bg-lime-50"
          : "border-slate-200 bg-white",
      )}
    >
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-xl font-black text-slate-950">{valor}</p>
    </article>
  );
}

function TarjetaMetrica({
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
      <p className="mt-3 text-4xl font-black tracking-tight text-slate-950">
        {valor}
      </p>
      <p className="mt-2 text-xs leading-5 text-slate-500">{ayuda}</p>
    </article>
  );
}

function TarjetaEstado({
  label,
  estado,
  descripcion,
  tipo = "neutro",
}: {
  label: string;
  estado: string;
  descripcion: string;
  tipo?: "ok" | "aviso" | "neutro";
}) {
  return (
    <article
      className={unirClases(
        "rounded-[1.5rem] border p-5 shadow-sm",
        tipo === "ok" && "border-lime-200 bg-lime-50",
        tipo === "aviso" && "border-amber-200 bg-amber-50",
        tipo === "neutro" && "border-slate-200 bg-white",
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-xl font-black text-slate-950">{estado}</p>
        </div>

        <span
          className={unirClases(
            "mt-1 h-3 w-3 rounded-full",
            tipo === "ok" && "bg-lime-400",
            tipo === "aviso" && "bg-amber-400",
            tipo === "neutro" && "bg-slate-300",
          )}
        />
      </div>

      <p className="mt-3 text-sm leading-6 text-slate-600">{descripcion}</p>
    </article>
  );
}

function AccesoRapido({
  href,
  titulo,
  descripcion,
}: {
  href: string;
  titulo: string;
  descripcion: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-lime-400 hover:bg-lime-50"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-black text-slate-950">{titulo}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {descripcion}
          </p>
        </div>

        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-sm font-black text-slate-500 transition group-hover:border-lime-300 group-hover:bg-lime-100 group-hover:text-lime-900">
          →
        </span>
      </div>
    </Link>
  );
}

export default async function PaginaInicio() {
  await obtenerUsuarioActual();

  const resumen = await obtenerResumenInicio();

  const perfil = resumen.perfil;
  const rutina = resumen.rutinaGuardada?.rutina ?? null;
  const ultimaRutinaGuardada = resumen.rutinaGuardada;
  const progreso = resumen.progreso;

  const rutinaDesactualizada = comprobarRutinaDesactualizada(
    perfil,
    ultimaRutinaGuardada?.rutina ?? null,
  );

  const tienePerfil = Boolean(perfil);
  const tieneRutina = Boolean(rutina);
  const sesionesRegistradas = progreso?.sesionesTotales ?? 0;

  const siguienteAccion = !tienePerfil
    ? {
        titulo: "Completa tu perfil",
        subtitulo: "Primer paso para personalizar tu entrenamiento.",
        descripcion:
          "Guarda tu objetivo, nivel, disponibilidad, material y molestias para que la aplicación pueda adaptar la rutina.",
        href: "/onboarding",
        textoBoton: "Completar perfil",
        etiqueta: "Configuración pendiente",
      }
    : !tieneRutina
      ? {
          titulo: "Genera tu rutina personalizada",
          subtitulo: "Tu perfil ya está listo.",
          descripcion:
            "Crea una rutina adaptada a tus datos actuales antes de iniciar el seguimiento de sesiones.",
          href: "/rutina?modo=nueva",
          textoBoton: "Generar rutina",
          etiqueta: "Rutina pendiente",
        }
      : rutinaDesactualizada
        ? {
            titulo: "Actualiza tu rutina",
            subtitulo: "Tu perfil ha cambiado.",
            descripcion:
              "Conviene regenerar la rutina para que vuelva a coincidir con tu objetivo, nivel, equipamiento y molestias.",
            href: "/rutina?modo=nueva",
            textoBoton: "Regenerar rutina",
            etiqueta: "Revisión recomendada",
          }
        : sesionesRegistradas === 0
          ? {
              titulo: "Registra tu primera sesión",
              subtitulo: "Rutina lista para entrenar.",
              descripcion:
                "Empieza un entrenamiento para guardar tus primeras métricas reales de progreso, fatiga y sensación.",
              href: "/entrenamiento",
              textoBoton: "Empezar entrenamiento",
              etiqueta: "Siguiente entrenamiento",
            }
          : {
              titulo: "Continúa entrenando",
              subtitulo: "Ya hay datos de progreso registrados.",
              descripcion:
                "Sigue completando sesiones para mejorar el análisis de evolución y las futuras adaptaciones.",
              href: "/entrenamiento",
              textoBoton: "Continuar entrenamiento",
              etiqueta: "Siguiente entrenamiento",
            };

  return (
    <ContenedorApp ancho="normal">
      <section className="overflow-hidden rounded-[2rem] border border-white/60 bg-white shadow-xl shadow-black/10">
        <div className="grid gap-8 p-6 md:p-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-lime-200 bg-lime-50 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-lime-800">
              <span className="h-2 w-2 rounded-full bg-lime-400" />
              {siguienteAccion.etiqueta}
            </div>

            <p className="text-sm font-bold text-slate-500">
              {siguienteAccion.subtitulo}
            </p>

            <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 md:text-5xl">
              {siguienteAccion.titulo}
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
              {siguienteAccion.descripcion}
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href={siguienteAccion.href}
                className={estilos.boton.primarioGrande}
              >
                {siguienteAccion.textoBoton}
              </Link>

              {tieneRutina && (
                <Link href="/rutina" className={estilos.boton.secundario}>
                  Ver rutina
                </Link>
              )}

              {tienePerfil && (
                <Link href="/perfil" className={estilos.boton.secundario}>
                  Ver perfil
                </Link>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <TarjetaDato
              label="Objetivo actual"
              valor={perfil?.objetivo ?? "No indicado"}
              destacado={Boolean(perfil?.objetivo)}
            />

            <TarjetaDato
              label="Nivel"
              valor={perfil?.nivel ?? "No indicado"}
              destacado={Boolean(perfil?.nivel)}
            />

            <TarjetaDato
              label="Días por semana"
              valor={perfil?.dias_por_semana ?? "-"}
              destacado={Boolean(perfil?.dias_por_semana)}
            />

            <TarjetaDato
              label="Rutina guardada"
              valor={rutina ? "Disponible" : "No guardada"}
              destacado={Boolean(rutina)}
            />
          </div>
        </div>
      </section>

      {rutinaDesactualizada && (
        <section className={estilos.tarjeta.aviso}>
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className={estilos.texto.etiqueta}>Aviso de coherencia</p>

              <h2 className="mt-2 text-2xl font-black text-amber-950">
                Rutina posiblemente desactualizada
              </h2>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-amber-900">
                El perfil ha cambiado después de guardar la última rutina.
                Conviene revisarla o regenerarla para que vuelva a coincidir
                con tu objetivo, nivel, equipamiento y molestias.
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
      )}

      <section className={estilos.tarjeta.base}>
        <div className="mb-6">
          <p className={estilos.texto.etiquetaVerde}>
            Estado de preparación
          </p>

          <h2 className="mt-2 text-3xl font-black text-slate-950">
            Estado actual
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            Resumen rápido de perfil, rutina y datos registrados para saber si
            la aplicación está lista para entrenar y analizar progreso.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <TarjetaEstado
            label="Perfil"
            estado={tienePerfil ? "Configurado" : "Pendiente"}
            descripcion={
              tienePerfil
                ? "Objetivo, nivel, disponibilidad y preferencias guardadas."
                : "Falta completar el onboarding para personalizar la rutina."
            }
            tipo={tienePerfil ? "ok" : "neutro"}
          />

          <TarjetaEstado
            label="Rutina"
            estado={
              !tieneRutina
                ? "No generada"
                : rutinaDesactualizada
                  ? "Desactualizada"
                  : "Disponible"
            }
            descripcion={
              !tieneRutina
                ? "Aún no hay una rutina guardada para entrenar."
                : rutinaDesactualizada
                  ? "La rutina puede no coincidir con el perfil actual."
                  : "La rutina está disponible para entrenamiento."
            }
            tipo={
              !tieneRutina ? "neutro" : rutinaDesactualizada ? "aviso" : "ok"
            }
          />

          <TarjetaEstado
            label="Progreso"
            estado={sesionesRegistradas > 0 ? "Con datos" : "Sin sesiones"}
            descripcion={
              sesionesRegistradas > 0
                ? `Hay ${sesionesRegistradas} sesiones registradas para analizar evolución.`
                : "Todavía no hay sesiones suficientes para calcular progreso real."
            }
            tipo={sesionesRegistradas > 0 ? "ok" : "neutro"}
          />
        </div>
      </section>

      <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <TarjetaMetrica
          label="Sesiones"
          valor={progreso?.sesionesTotales ?? 0}
          ayuda="Entrenamientos guardados."
        />

        <TarjetaMetrica
          label="Ejercicios"
          valor={progreso?.ejerciciosTotales ?? 0}
          ayuda="Ejercicios completados."
        />

        <TarjetaMetrica
          label="Series reales"
          valor={progreso?.seriesTotales ?? 0}
          ayuda="Volumen total registrado."
        />

        <TarjetaMetrica
          label="Peso registrado"
          valor={progreso?.pesoTotalRegistrado ?? 0}
          ayuda="Suma de cargas introducidas."
        />
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className={estilos.tarjeta.base}>
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className={estilos.texto.etiqueta}>Configuración</p>

              <h2 className="mt-2 text-2xl font-black text-slate-950">
                Perfil actual
              </h2>

              <p className="mt-1 text-sm leading-6 text-slate-600">
                Datos que usa la app para adaptar las rutinas.
              </p>
            </div>

            <Link href="/perfil" className={estilos.boton.secundario}>
              Ver perfil
            </Link>
          </div>

          {!perfil ? (
            <div className={estilos.tarjeta.suave}>
              <p className="font-bold text-slate-950">
                Todavía no hay perfil guardado.
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Completa el onboarding para activar la personalización.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <TarjetaDato label="Nombre" valor={perfil.nombre || "Sin nombre"} />
              <TarjetaDato label="Objetivo" valor={perfil.objetivo} />
              <TarjetaDato label="Nivel" valor={perfil.nivel} />
              <TarjetaDato
                label="Días por semana"
                valor={perfil.dias_por_semana}
              />

              <article className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 shadow-sm sm:col-span-2">
                <p className="text-sm font-medium text-slate-500">
                  Equipo disponible
                </p>

                <p className="mt-2 font-bold leading-6 text-slate-950">
                  {perfil.equipo_disponible
                    ? perfil.equipo_disponible.split(",").join(", ")
                    : "No indicado"}
                </p>
              </article>
            </div>
          )}
        </div>

        <div className={estilos.tarjeta.base}>
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className={estilos.texto.etiqueta}>Plan activo</p>

              <h2 className="mt-2 text-2xl font-black text-slate-950">
                Última rutina guardada
              </h2>

              <p className="mt-1 text-sm leading-6 text-slate-600">
                Rutina disponible para editar o usar en entrenamiento.
              </p>
            </div>

            <Link href="/rutina" className={estilos.boton.secundario}>
              Ver rutina
            </Link>
          </div>

          {!rutina ? (
            <div className={estilos.tarjeta.suave}>
              <p className="font-bold text-slate-950">
                Todavía no hay ninguna rutina guardada.
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Genera una rutina cuando el perfil esté configurado.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <TarjetaDato label="Objetivo" valor={rutina.objetivo} />
              <TarjetaDato label="Nivel" valor={rutina.nivel} />
              <TarjetaDato
                label="Días por semana"
                valor={rutina.dias_por_semana}
              />
              <TarjetaDato
                label="Índice de rotación"
                valor={rutina.indice_rotacion ?? 0}
              />
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/rutina" className={estilos.boton.secundario}>
              Revisar rutina
            </Link>

            <Link href="/entrenamiento" className={estilos.boton.primario}>
              Ir a entrenamiento
            </Link>
          </div>
        </div>
      </section>

      <section className={estilos.tarjeta.base}>
        <div className="mb-6">
          <p className={estilos.texto.etiqueta}>Accesos directos</p>

          <h2 className="mt-2 text-2xl font-black text-slate-950">
            Herramientas principales
          </h2>

          <p className="mt-1 text-sm leading-6 text-slate-600">
            Accede rápidamente a las zonas clave de personalización,
            entrenamiento y análisis.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <AccesoRapido
            href="/onboarding"
            titulo="Configurar perfil"
            descripcion="Editar objetivo, nivel, material, días y molestias."
          />

          <AccesoRapido
            href="/ejercicios"
            titulo="Biblioteca"
            descripcion="Consultar ejercicios, técnica y alternativas."
          />

          <AccesoRapido
            href="/entrenamiento"
            titulo="Entrenar"
            descripcion="Registrar series, peso, fatiga, dolor y sensación."
          />

          <AccesoRapido
            href="/progreso"
            titulo="Progreso"
            descripcion="Ver métricas, evolución y diagnóstico automático."
          />
        </div>
      </section>
    </ContenedorApp>
  );
}