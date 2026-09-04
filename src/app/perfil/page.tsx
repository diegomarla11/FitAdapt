import Link from "next/link";
import { obtenerUltimoPerfil } from "@/lib/rutina/obtenerUltimaRutina";
import type { Perfil } from "@/tipos/perfil";
import FormularioPerfil from "@/componentes/formularioPerfil";
import CabeceraPagina from "@/componentes/cabeceraPagina";
import { obtenerUsuarioActual } from "@/lib/auth/obtenerUsuarioActual";
import ContenedorApp from "@/componentes/contenedorApp";
import { estilos } from "@/lib/ui/estilos";

export const dynamic = "force-dynamic";

export default async function PaginaPerfil() {
  await obtenerUsuarioActual();

  const perfil = (await obtenerUltimoPerfil()) as Perfil | null;

  if (!perfil) {
    return (
      <ContenedorApp ancho="estrecho">
        <CabeceraPagina
          titulo="Perfil"
          descripcion="Consulta y edita la configuración actual de tu cuenta."
          acciones={
            <Link href="/onboarding" className={estilos.boton.primario}>
              Crear perfil
            </Link>
          }
        />

        <section className={estilos.tarjeta.base}>
          <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50 p-6">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-amber-800">
              Perfil pendiente
            </p>

            <h2 className="mt-3 text-2xl font-black text-amber-950">
              Todavía no hay ningún perfil guardado
            </h2>

            <p className="mt-2 text-sm leading-6 text-amber-900">
              Completa la configuración inicial para que FitAdapt pueda generar
              una rutina adaptada a tu objetivo, nivel, disponibilidad,
              equipamiento y molestias.
            </p>

            <div className="mt-5">
              <Link href="/onboarding" className={estilos.boton.primario}>
                Completar configuración
              </Link>
            </div>
          </div>
        </section>
      </ContenedorApp>
    );
  }

  return (
    <ContenedorApp ancho="detalle">
      <CabeceraPagina
        titulo="Perfil"
        descripcion="Revisa y actualiza los datos que utiliza FitAdapt para adaptar tus rutinas, ejercicios, volumen de trabajo y recomendaciones."
        acciones={
          <div className="flex flex-wrap gap-3">
            <Link href="/rutina" className={estilos.boton.secundario}>
              Revisar rutina
            </Link>

            <Link href="/entrenamiento" className={estilos.boton.primario}>
              Ir a entrenamiento
            </Link>
          </div>
        }
      />

      <FormularioPerfil perfil={perfil} />
    </ContenedorApp>
  );
}