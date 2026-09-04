"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Ejercicio } from "@/tipos/ejercicio";
import { estilos, unirClases } from "@/lib/ui/estilos";

type Props = {
  ejercicios: Ejercicio[];
};

type OrdenEjercicios = "nombre" | "grupo" | "dificultad" | "equipamiento";

function normalizarTexto(valor: string | null | undefined) {
  return (
    valor
      ?.toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim() ?? ""
  );
}

function formatearTexto(valor: string | null | undefined) {
  if (!valor) {
    return "No indicado";
  }

  return valor
    .split(",")
    .map((parte) => parte.trim())
    .filter(Boolean)
    .map((parte) => parte.charAt(0).toUpperCase() + parte.slice(1))
    .join(", ");
}

function obtenerTextoBusquedaEjercicio(ejercicio: Ejercicio) {
  return normalizarTexto(
    [
      ejercicio.nombre,
      ejercicio.grupo_muscular,
      ejercicio.patron_movimiento,
      ejercicio.equipamiento,
      ejercicio.dificultad,
      ejercicio.descripcion,
      ejercicio.instrucciones,
      ejercicio.errores_comunes,
      ejercicio.ajustes,
      ejercicio.recomendaciones_nivel,
      ejercicio.variantes,
      ejercicio.contraindicaciones,
    ]
      .filter(Boolean)
      .join(" "),
  );
}

function ordenarEjercicios(ejercicios: Ejercicio[], orden: OrdenEjercicios) {
  return [...ejercicios].sort((a, b) => {
    if (orden === "grupo") {
      const grupoA = normalizarTexto(a.grupo_muscular);
      const grupoB = normalizarTexto(b.grupo_muscular);

      if (grupoA !== grupoB) {
        return grupoA.localeCompare(grupoB);
      }

      return normalizarTexto(a.nombre).localeCompare(normalizarTexto(b.nombre));
    }

    if (orden === "dificultad") {
      const prioridad: Record<string, number> = {
        principiante: 1,
        intermedio: 2,
        avanzado: 3,
      };

      const dificultadA = prioridad[normalizarTexto(a.dificultad)] ?? 99;
      const dificultadB = prioridad[normalizarTexto(b.dificultad)] ?? 99;

      if (dificultadA !== dificultadB) {
        return dificultadA - dificultadB;
      }

      return normalizarTexto(a.nombre).localeCompare(normalizarTexto(b.nombre));
    }

    if (orden === "equipamiento") {
      const equipamientoA = normalizarTexto(a.equipamiento);
      const equipamientoB = normalizarTexto(b.equipamiento);

      if (equipamientoA !== equipamientoB) {
        return equipamientoA.localeCompare(equipamientoB);
      }

      return normalizarTexto(a.nombre).localeCompare(normalizarTexto(b.nombre));
    }

    return normalizarTexto(a.nombre).localeCompare(normalizarTexto(b.nombre));
  });
}

function CampoFiltro({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-500">
        {label}
      </span>

      {children}
    </label>
  );
}

function DatoEjercicio({
  label,
  valor,
}: {
  label: string;
  valor: string;
}) {
  return (
    <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-medium text-slate-500">{label}</p>

      <p className="mt-1 text-sm font-black text-slate-950">{valor}</p>
    </div>
  );
}

function obtenerClaseDificultad(dificultad: string | null | undefined) {
  const valor = normalizarTexto(dificultad);

  if (valor === "principiante") {
    return estilos.badge.activo;
  }

  if (valor === "intermedio") {
    return estilos.badge.info;
  }

  if (valor === "avanzado") {
    return estilos.badge.aviso;
  }

  return estilos.badge.base;
}

export default function ListaEjerciciosFiltrada({ ejercicios }: Props) {
  const [busqueda, setBusqueda] = useState("");
  const [grupoMuscular, setGrupoMuscular] = useState("");
  const [patronMovimiento, setPatronMovimiento] = useState("");
  const [equipamiento, setEquipamiento] = useState("");
  const [dificultad, setDificultad] = useState("");
  const [orden, setOrden] = useState<OrdenEjercicios>("nombre");

  const gruposMusculares = useMemo(
    () =>
      Array.from(
        new Set(
          ejercicios
            .map((item) => item.grupo_muscular)
            .filter((valor): valor is string => Boolean(valor)),
        ),
      ).sort(),
    [ejercicios],
  );

  const patronesMovimiento = useMemo(
    () =>
      Array.from(
        new Set(
          ejercicios
            .map((item) => item.patron_movimiento)
            .filter((valor): valor is string => Boolean(valor)),
        ),
      ).sort(),
    [ejercicios],
  );

  const equipamientos = useMemo(
    () =>
      Array.from(
        new Set(
          ejercicios
            .map((item) => item.equipamiento)
            .filter((valor): valor is string => Boolean(valor)),
        ),
      ).sort(),
    [ejercicios],
  );

  const dificultades = useMemo(
    () =>
      Array.from(
        new Set(
          ejercicios
            .map((item) => item.dificultad)
            .filter((valor): valor is string => Boolean(valor)),
        ),
      ).sort(),
    [ejercicios],
  );

  const resumenPorGrupo = useMemo(() => {
    return gruposMusculares.map((grupo) => ({
      grupo,
      total: ejercicios.filter(
        (ejercicio) => ejercicio.grupo_muscular === grupo,
      ).length,
    }));
  }, [ejercicios, gruposMusculares]);

  const ejerciciosFiltrados = useMemo(() => {
    const textoBusqueda = normalizarTexto(busqueda);

    const filtrados = ejercicios.filter((ejercicio) => {
      const cumpleBusqueda =
        !textoBusqueda ||
        obtenerTextoBusquedaEjercicio(ejercicio).includes(textoBusqueda);

      const cumpleGrupo =
        !grupoMuscular || ejercicio.grupo_muscular === grupoMuscular;

      const cumplePatron =
        !patronMovimiento || ejercicio.patron_movimiento === patronMovimiento;

      const cumpleEquipamiento =
        !equipamiento || ejercicio.equipamiento === equipamiento;

      const cumpleDificultad =
        !dificultad || ejercicio.dificultad === dificultad;

      return (
        cumpleBusqueda &&
        cumpleGrupo &&
        cumplePatron &&
        cumpleEquipamiento &&
        cumpleDificultad
      );
    });

    return ordenarEjercicios(filtrados, orden);
  }, [
    busqueda,
    dificultad,
    ejercicios,
    equipamiento,
    grupoMuscular,
    orden,
    patronMovimiento,
  ]);

  const hayFiltrosActivos =
    busqueda ||
    grupoMuscular ||
    patronMovimiento ||
    equipamiento ||
    dificultad ||
    orden !== "nombre";

  function limpiarFiltros() {
    setBusqueda("");
    setGrupoMuscular("");
    setPatronMovimiento("");
    setEquipamiento("");
    setDificultad("");
    setOrden("nombre");
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200 bg-slate-50 p-5 shadow-sm md:p-6">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className={estilos.texto.etiquetaVerde}>Filtros avanzados</p>

            <h2 className="mt-2 text-2xl font-black text-slate-950">
              Encuentra el ejercicio adecuado
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Busca por nombre, descripción o contenido técnico. También puedes
              filtrar por grupo muscular, patrón de movimiento, equipamiento y
              dificultad.
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4">
            <p className="text-sm font-medium text-slate-500">Resultado</p>

            <p className="mt-1 text-2xl font-black text-slate-950">
              {ejerciciosFiltrados.length}/{ejercicios.length}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              ejercicios visibles
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
          <div className="xl:col-span-2">
            <CampoFiltro label="Buscar">
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Ej. dominadas, lumbar, rodilla..."
                className={estilos.input.base}
              />
            </CampoFiltro>
          </div>

          <CampoFiltro label="Grupo muscular">
            <select
              value={grupoMuscular}
              onChange={(e) => setGrupoMuscular(e.target.value)}
              className={estilos.input.select}
            >
              <option value="">Todos</option>
              {gruposMusculares.map((opcion) => (
                <option key={opcion} value={opcion}>
                  {formatearTexto(opcion)}
                </option>
              ))}
            </select>
          </CampoFiltro>

          <CampoFiltro label="Patrón">
            <select
              value={patronMovimiento}
              onChange={(e) => setPatronMovimiento(e.target.value)}
              className={estilos.input.select}
            >
              <option value="">Todos</option>
              {patronesMovimiento.map((opcion) => (
                <option key={opcion} value={opcion}>
                  {formatearTexto(opcion)}
                </option>
              ))}
            </select>
          </CampoFiltro>

          <CampoFiltro label="Equipamiento">
            <select
              value={equipamiento}
              onChange={(e) => setEquipamiento(e.target.value)}
              className={estilos.input.select}
            >
              <option value="">Todos</option>
              {equipamientos.map((opcion) => (
                <option key={opcion} value={opcion}>
                  {formatearTexto(opcion)}
                </option>
              ))}
            </select>
          </CampoFiltro>

          <CampoFiltro label="Dificultad">
            <select
              value={dificultad}
              onChange={(e) => setDificultad(e.target.value)}
              className={estilos.input.select}
            >
              <option value="">Todas</option>
              {dificultades.map((opcion) => (
                <option key={opcion} value={opcion}>
                  {formatearTexto(opcion)}
                </option>
              ))}
            </select>
          </CampoFiltro>

          <CampoFiltro label="Ordenar por">
            <select
              value={orden}
              onChange={(e) => setOrden(e.target.value as OrdenEjercicios)}
              className={estilos.input.select}
            >
              <option value="nombre">Nombre</option>
              <option value="grupo">Grupo muscular</option>
              <option value="dificultad">Dificultad</option>
              <option value="equipamiento">Equipamiento</option>
            </select>
          </CampoFiltro>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={limpiarFiltros}
            className={hayFiltrosActivos ? estilos.boton.secundario : estilos.boton.ghost}
          >
            Limpiar filtros
          </button>

          {hayFiltrosActivos && (
            <span className={estilos.badge.info}>Filtros activos</span>
          )}

          {!hayFiltrosActivos && (
            <span className={estilos.badge.base}>Mostrando todo</span>
          )}
        </div>

        <div className="mt-5 border-t border-slate-200 pt-5">
          <p className="mb-3 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
            Accesos rápidos por grupo
          </p>

          <div className="flex flex-wrap gap-2">
            {resumenPorGrupo.map((item) => {
              const activo = grupoMuscular === item.grupo;

              return (
                <button
                  key={item.grupo}
                  type="button"
                  onClick={() =>
                    setGrupoMuscular((actual) =>
                      actual === item.grupo ? "" : item.grupo,
                    )
                  }
                  className={unirClases(
                    "rounded-full border px-3 py-1.5 text-xs font-black transition",
                    activo
                      ? "border-slate-950 bg-slate-950 text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:border-lime-300 hover:bg-lime-50",
                  )}
                >
                  {formatearTexto(item.grupo)} · {item.total}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {ejerciciosFiltrados.length === 0 ? (
        <section className="rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className={estilos.texto.etiquetaVerde}>Sin resultados</p>

          <h3 className="mt-2 text-2xl font-black text-slate-950">
            No hay ejercicios con esos filtros
          </h3>

          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">
            Prueba a limpiar los filtros, cambiar el equipamiento o usar una
            búsqueda más general.
          </p>

          <button
            type="button"
            onClick={limpiarFiltros}
            className={`${estilos.boton.primario} mt-5`}
          >
            Limpiar filtros
          </button>
        </section>
      ) : (
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {ejerciciosFiltrados.map((ejercicio) => (
            <article
              key={ejercicio.id}
              className="group flex flex-col overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-lime-300 hover:shadow-md"
            >
              {ejercicio.imagen_url ? (
                <Link
                  href={`/ejercicios/${ejercicio.id}`}
                  className="relative block h-48 w-full overflow-hidden border-b border-slate-200 bg-slate-100"
                >
                  <Image
                    src={ejercicio.imagen_url}
                    alt={`Demostración del ejercicio ${ejercicio.nombre}`}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                    className="object-cover transition duration-300 group-hover:scale-[1.03]"
                  />
                </Link>
              ) : (
                <div className="flex h-48 items-center justify-center border-b border-slate-200 bg-slate-50">
                  <div className="rounded-full border border-lime-200 bg-lime-50 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-lime-800">
                    Sin imagen
                  </div>
                </div>
              )}

              <div className="flex flex-1 flex-col p-5">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <p className={estilos.texto.etiquetaVerde}>
                      {formatearTexto(ejercicio.grupo_muscular)}
                    </p>

                    <Link href={`/ejercicios/${ejercicio.id}`}>
                      <h2 className="mt-2 text-xl font-black leading-tight text-slate-950 transition group-hover:text-lime-700">
                        {ejercicio.nombre}
                      </h2>
                    </Link>
                  </div>

                  <span className={obtenerClaseDificultad(ejercicio.dificultad)}>
                    {formatearTexto(ejercicio.dificultad)}
                  </span>
                </div>

                <div className="mb-4 flex flex-wrap gap-2">
                  <span className={estilos.badge.base}>
                    {formatearTexto(ejercicio.patron_movimiento)}
                  </span>

                  <span className={estilos.badge.base}>
                    {formatearTexto(ejercicio.equipamiento)}
                  </span>
                </div>

                <p className="line-clamp-3 rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                  {ejercicio.descripcion || "Sin descripción registrada."}
                </p>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <DatoEjercicio
                    label="Patrón"
                    valor={formatearTexto(ejercicio.patron_movimiento)}
                  />

                  <DatoEjercicio
                    label="Material"
                    valor={formatearTexto(ejercicio.equipamiento)}
                  />
                </div>

                <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-200 pt-4">
                  <Link
                    href={`/ejercicios/${ejercicio.id}`}
                    className={estilos.boton.primario}
                  >
                    Ver detalle
                  </Link>

                  <span className="text-xs font-bold text-slate-400">
                    Técnica
                  </span>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}