import Link from "next/link";
import CabeceraPagina from "@/componentes/cabeceraPagina";
import ValidadorTecnica from "@/componentes/validadorTecnica";
import { obtenerUsuarioActual } from "@/lib/auth/obtenerUsuarioActual";
import ContenedorApp from "@/componentes/contenedorApp";
import { estilos } from "@/lib/ui/estilos";

export const dynamic = "force-dynamic";

export default async function PaginaValidacionTecnica() {
  await obtenerUsuarioActual();

  return (
    <ContenedorApp ancho="normal">
      <CabeceraPagina
        titulo="Validación técnica"
        descripcion="Sube un vídeo corto realizando un ejercicio y recibe una evaluación aproximada de la técnica mediante visión artificial."
        acciones={
          <div className="flex flex-wrap gap-3">
            <Link href="/ejercicios" className={estilos.boton.secundario}>
              Ver ejercicios
            </Link>

            <Link href="/entrenamiento" className={estilos.boton.primario}>
              Ir al entrenamiento
            </Link>
          </div>
        }
      />

      <section className={estilos.tarjeta.destacada}>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <div>
            <p className={estilos.texto.etiquetaVerde}>Análisis por vídeo</p>

            <h2 className="mt-2 text-2xl font-black text-slate-950">
              Evalúa la técnica antes de progresar
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">
              Este módulo analiza puntos corporales detectados en vídeo para
              ofrecer una orientación aproximada sobre la ejecución. Es útil
              para detectar señales básicas de técnica, control y posición.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <div className="rounded-2xl border border-lime-200 bg-white p-4">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-lime-800">
                Grabación
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                Cuerpo completo y cámara fija.
              </p>
            </div>

            <div className="rounded-2xl border border-lime-200 bg-white p-4">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-lime-800">
                Análisis
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                Se procesan varios frames del vídeo.
              </p>
            </div>

            <div className="rounded-2xl border border-lime-200 bg-white p-4">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-lime-800">
                Resultado
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                Recibes puntuación y mensajes técnicos.
              </p>
            </div>
          </div>
        </div>
      </section>

      <ValidadorTecnica />
    </ContenedorApp>
  );
}