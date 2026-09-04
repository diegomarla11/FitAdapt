import Link from "next/link";
import EntrenamientoActual from "@/componentes/entrenamientoActual";
import { obtenerEntrenamientoActual } from "@/lib/entrenamiento/obtenerEntrenamientoActual";
import { obtenerSesionesRutina } from "@/lib/entrenamiento/obtenerSesionesRutina";
import CabeceraPagina from "@/componentes/cabeceraPagina";
import { obtenerUsuarioActual } from "@/lib/auth/obtenerUsuarioActual";
import ContenedorApp from "@/componentes/contenedorApp";
import { estilos, unirClases } from "@/lib/ui/estilos";

export const dynamic = "force-dynamic";

function TarjetaMetricaEntrenamiento({
  label,
  valor,
  descripcion,
  tipo = "base",
}: {
  label: string;
  valor: string | number;
  descripcion: string;
  tipo?: "base" | "ok" | "info" | "aviso";
}) {
  return (
    <article
      className={unirClases(
        "rounded-[1.5rem] border p-5 shadow-sm",
        tipo === "base" && "border-slate-200 bg-white",
        tipo === "ok" && "border-lime-200 bg-lime-50",
        tipo === "info" && "border-blue-200 bg-blue-50",
        tipo === "aviso" && "border-amber-200 bg-amber-50",
      )}
    >
      <p
        className={unirClases(
          "text-sm font-medium",
          tipo === "base" && "text-slate-500",
          tipo === "ok" && "text-lime-800",
          tipo === "info" && "text-blue-800",
          tipo === "aviso" && "text-amber-800",
        )}
      >
        {label}
      </p>

      <p className="mt-2 text-2xl font-black tracking-tight text-slate-950">
        {valor}
      </p>

      <p
        className={unirClases(
          "mt-2 text-xs leading-5",
          tipo === "base" && "text-slate-500",
          tipo === "ok" && "text-lime-900",
          tipo === "info" && "text-blue-900",
          tipo === "aviso" && "text-amber-900",
        )}
      >
        {descripcion}
      </p>
    </article>
  );
}

function EstadoSinRutina() {
  return (
    <section className={estilos.tarjeta.base}>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_0.75fr] lg:items-center">
        <div>
          <p className={estilos.texto.etiquetaVerde}>Rutina pendiente</p>

          <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
            Todavía no hay una rutina guardada
          </h2>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            Para registrar entrenamientos necesitas generar y guardar primero
            una rutina adaptada a tu perfil. Después podrás marcar ejercicios,
            guardar datos reales, registrar dolor, fatiga y descanso.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/rutina?modo=nueva" className={estilos.boton.primario}>
              Crear rutina ahora
            </Link>

            <Link href="/perfil" className={estilos.boton.secundario}>
              Revisar perfil
            </Link>
          </div>
        </div>

        <aside className={estilos.tarjeta.destacada}>
          <p className={estilos.texto.etiquetaVerde}>Siguiente paso</p>

          <h3 className="mt-2 text-2xl font-black text-slate-950">
            Generar y guardar plan
          </h3>

          <p className="mt-3 text-sm leading-6 text-slate-700">
            La pantalla de entrenamiento solo se activa cuando existe una
            rutina guardada, porque necesita días, ejercicios, series y
            repeticiones planificadas.
          </p>
        </aside>
      </div>
    </section>
  );
}

export default async function PaginaEntrenamiento() {
  await obtenerUsuarioActual();

  const resultado = await obtenerEntrenamientoActual();

  const sesionesGuardadas = resultado
    ? await obtenerSesionesRutina(resultado.rutina.id)
    : [];

  if (!resultado) {
    return (
      <ContenedorApp ancho="normal">
        <CabeceraPagina
          titulo="Entrenamiento"
          descripcion="Sigue tu sesión actual, marca ejercicios completados y guarda datos reales de rendimiento."
          acciones={
            <Link href="/rutina?modo=nueva" className={estilos.boton.primario}>
              Generar rutina
            </Link>
          }
        />

        <EstadoSinRutina />
      </ContenedorApp>
    );
  }

  const totalDias = resultado.dias.length;

  const totalEjercicios = resultado.dias.reduce(
    (total, dia) => total + dia.ejercicios.length,
    0,
  );

  const totalSeriesPlanificadas = resultado.dias.reduce(
    (total, dia) =>
      total +
      dia.ejercicios.reduce(
        (subtotal, ejercicio) => subtotal + ejercicio.series,
        0,
      ),
    0,
  );

  const sesionesRegistradas = sesionesGuardadas.length;

  const ejerciciosRegistrados = sesionesGuardadas.reduce(
    (total, sesion) => total + sesion.sesion_ejercicios.length,
    0,
  );

  const diasConSesion = new Set(sesionesGuardadas.map((sesion) => sesion.dia))
    .size;

  const ultimaSesion = sesionesGuardadas[0];

  return (
    <ContenedorApp ancho="normal">
      <CabeceraPagina
        titulo="Entrenamiento activo"
        descripcion="Registra cada sesión con datos reales: ejercicios completados, series, repeticiones, peso, descanso, dolor, fatiga y sensación."
        acciones={
          <div className="flex flex-wrap gap-3">
            <Link href="/rutina" className={estilos.boton.secundario}>
              Ver rutina
            </Link>

            <Link href="/progreso" className={estilos.boton.primario}>
              Ver progreso
            </Link>
          </div>
        }
      />

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <TarjetaMetricaEntrenamiento
          label="Rutina"
          valor="Disponible"
          descripcion={`${totalDias} días · ${totalEjercicios} ejercicios · ${totalSeriesPlanificadas} series.`}
          tipo="ok"
        />

        <TarjetaMetricaEntrenamiento
          label="Sesiones guardadas"
          valor={sesionesRegistradas}
          descripcion="Entrenamientos registrados sobre esta rutina."
          tipo={sesionesRegistradas > 0 ? "info" : "base"}
        />

        <TarjetaMetricaEntrenamiento
          label="Días con datos"
          valor={`${diasConSesion}/${totalDias}`}
          descripcion="Bloques de entrenamiento que ya tienen registros."
          tipo={diasConSesion > 0 ? "info" : "base"}
        />

        <TarjetaMetricaEntrenamiento
          label="Ejercicios registrados"
          valor={ejerciciosRegistrados}
          descripcion="Ejercicios guardados en sesiones anteriores."
          tipo={ejerciciosRegistrados > 0 ? "ok" : "base"}
        />
      </section>

      <section className={estilos.tarjeta.base}>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_0.8fr] lg:items-center">
          <div>
            <p className={estilos.texto.etiquetaVerde}>
              Seguimiento de sesión
            </p>

            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
              Registra el entrenamiento de hoy
            </h2>

            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              Selecciona el día, marca los ejercicios realizados y completa solo
              los datos que quieras ajustar. Si no rellenas series o
              repeticiones reales, se utilizará automáticamente lo planificado.
            </p>
          </div>

          <aside className="rounded-[1.5rem] border border-blue-200 bg-blue-50 p-5">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-800">
              Último registro
            </p>

            {ultimaSesion ? (
              <>
                <p className="mt-2 text-xl font-black text-blue-950">
                  Día {ultimaSesion.dia} · {ultimaSesion.titulo_dia}
                </p>

                <p className="mt-2 text-sm leading-6 text-blue-900">
                  Última sesión guardada el {ultimaSesion.fecha}. Puedes
                  revisar ese día o actualizarlo si repites el entrenamiento.
                </p>
              </>
            ) : (
              <>
                <p className="mt-2 text-xl font-black text-blue-950">
                  Sin sesiones previas
                </p>

                <p className="mt-2 text-sm leading-6 text-blue-900">
                  Esta será la primera sesión registrada para la rutina actual.
                  Los próximos entrenamientos podrán usar estos datos como
                  historial.
                </p>
              </>
            )}
          </aside>
        </div>
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <EntrenamientoActual
          rutinaId={resultado.rutina.id}
          dias={resultado.dias}
          sesionesGuardadas={sesionesGuardadas}
        />
      </section>
    </ContenedorApp>
  );
}