import Link from "next/link";
import { crearClienteSupabaseServer } from "@/lib/supabase/server";
import ListaEjerciciosFiltrada from "@/componentes/listaEjerciciosFiltrada";
import CabeceraPagina from "@/componentes/cabeceraPagina";
import type { Ejercicio } from "@/tipos/ejercicio";
import { obtenerUsuarioActual } from "@/lib/auth/obtenerUsuarioActual";
import ContenedorApp from "@/componentes/contenedorApp";
import { estilos } from "@/lib/ui/estilos";

export const dynamic = "force-dynamic";

function obtenerUnicos(
  ejercicios: Ejercicio[],
  campo: "grupo_muscular" | "patron_movimiento" | "equipamiento" | "dificultad",
) {
  return Array.from(
    new Set(
      ejercicios
        .map((ejercicio) => ejercicio[campo])
        .filter((valor): valor is string => Boolean(valor && valor.trim())),
    ),
  );
}

function TarjetaBiblioteca({
  label,
  valor,
  descripcion,
  tipo = "base",
}: {
  label: string;
  valor: string | number;
  descripcion: string;
  tipo?: "base" | "ok" | "info";
}) {
  const clase =
    tipo === "ok"
      ? estilos.tarjeta.destacada
      : tipo === "info"
        ? estilos.tarjeta.info
        : estilos.tarjeta.metrica;

  return (
    <article className={clase}>
      <p className="text-sm font-medium text-slate-500">{label}</p>

      <p className="mt-2 text-3xl font-black tracking-tight text-slate-950">
        {valor}
      </p>

      <p className="mt-2 text-xs leading-5 text-slate-500">{descripcion}</p>
    </article>
  );
}

export default async function PaginaEjercicios() {
  await obtenerUsuarioActual();

  const supabase = await crearClienteSupabaseServer();

  const { data: ejercicios, error } = await supabase
    .from("ejercicios")
    .select("*")
    .order("nombre", { ascending: true });

  if (error) {
    return (
      <ContenedorApp ancho="normal">
        <CabeceraPagina
          titulo="Ejercicios"
          descripcion="Explora la biblioteca de ejercicios, consulta su técnica y encuentra variantes compatibles con tu perfil."
          acciones={
            <Link href="/rutina" className={estilos.boton.secundario}>
              Ver rutina
            </Link>
          }
        />

        <section className={estilos.tarjeta.error}>
          <p className="text-sm font-black uppercase tracking-[0.16em] text-red-800">
            Error de carga
          </p>

          <h2 className="mt-2 text-2xl font-black text-red-950">
            No se ha podido cargar el listado
          </h2>

          <p className="mt-2 text-sm leading-6 text-red-900">
            Revisa la conexión con Supabase o vuelve a intentarlo. La biblioteca
            de ejercicios es necesaria para consultar técnica, sustituir
            ejercicios y generar rutinas compatibles.
          </p>
        </section>
      </ContenedorApp>
    );
  }

  const listaEjercicios = (ejercicios ?? []) as Ejercicio[];

  const grupos = obtenerUnicos(listaEjercicios, "grupo_muscular");
  const patrones = obtenerUnicos(listaEjercicios, "patron_movimiento");
  const equipamientos = obtenerUnicos(listaEjercicios, "equipamiento");

  return (
    <ContenedorApp ancho="normal">
      <CabeceraPagina
        titulo="Ejercicios"
        descripcion="Explora, filtra y consulta los ejercicios de la aplicación según grupo muscular, patrón de movimiento, equipamiento y dificultad."
        acciones={
          <div className="flex flex-wrap gap-3">
            <Link href="/rutina" className={estilos.boton.secundario}>
              Ver rutina
            </Link>

            <Link href="/validacion" className={estilos.boton.primario}>
              Validar técnica
            </Link>
          </div>
        }
      />

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <TarjetaBiblioteca
          label="Biblioteca"
          valor={listaEjercicios.length}
          descripcion="Ejercicios disponibles para generar rutinas y consultar técnica."
          tipo="ok"
        />

        <TarjetaBiblioteca
          label="Grupos musculares"
          valor={grupos.length}
          descripcion="Zonas musculares clasificadas en la base de datos."
        />

        <TarjetaBiblioteca
          label="Patrones"
          valor={patrones.length}
          descripcion="Tipos de movimiento utilizados para adaptar sustituciones."
        />

        <TarjetaBiblioteca
          label="Equipamiento"
          valor={equipamientos.length}
          descripcion="Material detectado para filtrar ejercicios compatibles."
          tipo="info"
        />
      </section>

      <section className={estilos.tarjeta.destacada}>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_0.85fr] lg:items-center">
          <div>
            <p className={estilos.texto.etiquetaVerde}>Uso recomendado</p>

            <h2 className="mt-2 text-2xl font-black text-slate-950">
              Consulta técnica antes de sustituir ejercicios
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">
              La biblioteca no sirve solo para buscar ejercicios. También ayuda
              a revisar instrucciones, errores comunes, variantes,
              contraindicaciones e historial reciente antes de modificar una
              rutina.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <div className="rounded-2xl border border-lime-200 bg-white p-4">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-lime-800">
                Técnica
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                Revisa ejecución y ajustes.
              </p>
            </div>

            <div className="rounded-2xl border border-lime-200 bg-white p-4">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-lime-800">
                Compatibilidad
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                Filtra por material y dificultad.
              </p>
            </div>

            <div className="rounded-2xl border border-lime-200 bg-white p-4">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-lime-800">
                Historial
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                Usa datos previos para progresar.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className={estilos.tarjeta.base}>
        <div className="mb-6">
          <p className={estilos.texto.etiquetaVerde}>Catálogo</p>

          <h2 className="mt-2 text-3xl font-black text-slate-950">
            Biblioteca de ejercicios
          </h2>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Busca por nombre o descripción y filtra por grupo muscular, patrón,
            equipamiento y dificultad.
          </p>
        </div>

        {listaEjercicios.length === 0 ? (
          <p className="text-sm leading-6 text-slate-600">
            No hay ejercicios disponibles en este momento.
          </p>
        ) : (
          <ListaEjerciciosFiltrada ejercicios={listaEjercicios} />
        )}
      </section>
    </ContenedorApp>
  );
}