"use client";

import Link from "next/link";
import { FormEvent, ReactNode, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { guardarPerfilOnboarding } from "@/app/onboarding/acciones";
import { opcionesEquipamiento } from "@/lib/shared/opcionesEquipamiento";
import CabeceraPagina from "@/componentes/cabeceraPagina";
import ContenedorApp from "@/componentes/contenedorApp";
import { estilos, unirClases } from "@/lib/ui/estilos";

const objetivos = [
  {
    valor: "hipertrofia",
    titulo: "Hipertrofia",
    descripcion: "Prioriza volumen, estímulo muscular y progresión controlada.",
  },
  {
    valor: "fuerza",
    titulo: "Fuerza",
    descripcion: "Prioriza cargas altas, básicos y descansos más amplios.",
  },
  {
    valor: "mantenimiento",
    titulo: "Mantenimiento",
    descripcion: "Mantiene condición física con volumen moderado.",
  },
  {
    valor: "recomposicion",
    titulo: "Recomposición",
    descripcion: "Equilibra ganancia muscular y control de fatiga.",
  },
];

const niveles = [
  {
    valor: "principiante",
    titulo: "Principiante",
    descripcion: "Rutinas simples, técnica prioritaria y volumen moderado.",
  },
  {
    valor: "intermedio",
    titulo: "Intermedio",
    descripcion: "Mayor variedad, progresiones y distribución semanal.",
  },
  {
    valor: "avanzado",
    titulo: "Avanzado",
    descripcion: "Más volumen, variantes y control de rendimiento.",
  },
];

const duracionesRapidas = [30, 45, 60, 75, 90];

const pasos = [
  "Usuario",
  "Objetivo",
  "Nivel",
  "Disponibilidad",
  "Equipamiento",
  "Limitaciones",
  "Resumen",
];

function capitalizar(texto: string) {
  if (!texto) {
    return "No indicado";
  }

  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function Campo({
  label,
  ayuda,
  children,
}: {
  label: string;
  ayuda?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-slate-700">
        {label}
      </span>

      {children}

      {ayuda && (
        <span className="mt-2 block text-xs leading-5 text-slate-500">
          {ayuda}
        </span>
      )}
    </label>
  );
}

function TarjetaOpcion({
  titulo,
  descripcion,
  activo,
  onClick,
}: {
  titulo: string;
  descripcion: string;
  activo: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={unirClases(
        "rounded-[1.5rem] border p-5 text-left shadow-sm transition hover:-translate-y-0.5",
        activo
          ? "border-lime-300 bg-lime-50 ring-4 ring-lime-400/15"
          : "border-slate-200 bg-white hover:border-lime-300 hover:bg-lime-50",
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-lg font-black text-slate-950">{titulo}</p>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            {descripcion}
          </p>
        </div>

        <span
          className={unirClases(
            "mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-black",
            activo
              ? "border-lime-400 bg-lime-400 text-slate-950"
              : "border-slate-300 bg-white text-transparent",
          )}
        >
          ✓
        </span>
      </div>
    </button>
  );
}

function ChipEquipo({
  equipo,
  activo,
  onClick,
}: {
  equipo: string;
  activo: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={unirClases(
        "flex items-center justify-between gap-3 rounded-2xl border px-4 py-4 text-left text-sm font-bold capitalize transition hover:-translate-y-0.5",
        activo
          ? "border-lime-300 bg-lime-50 text-lime-950 ring-4 ring-lime-400/10"
          : "border-slate-200 bg-white text-slate-700 hover:border-lime-300 hover:bg-lime-50",
      )}
    >
      <span>{equipo}</span>

      <span
        className={unirClases(
          "flex h-6 w-6 items-center justify-center rounded-full border text-xs font-black",
          activo
            ? "border-lime-400 bg-lime-400 text-slate-950"
            : "border-slate-300 bg-slate-50 text-transparent",
        )}
      >
        ✓
      </span>
    </button>
  );
}

function TarjetaResumen({
  label,
  valor,
  ayuda,
}: {
  label: string;
  valor: string | number;
  ayuda: string;
}) {
  return (
    <article className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
      <p className="text-sm font-medium text-slate-500">{label}</p>

      <p className="mt-2 text-xl font-black text-slate-950">{valor}</p>

      <p className="mt-2 text-xs leading-5 text-slate-500">{ayuda}</p>
    </article>
  );
}

function IndicadorPasos({
  pasoActual,
  irAPaso,
}: {
  pasoActual: number;
  irAPaso: (paso: number) => void;
}) {
  return (
    <section className={estilos.tarjeta.base}>
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className={estilos.texto.etiquetaVerde}>Configuración guiada</p>

          <h2 className="mt-2 text-2xl font-black text-slate-950">
            Paso {pasoActual + 1} de {pasos.length}
          </h2>
        </div>

        <span className={estilos.badge.activo}>
          {Math.round(((pasoActual + 1) / pasos.length) * 100)}%
        </span>
      </div>

      <div className="h-3 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-lime-400 transition-all"
          style={{
            width: `${((pasoActual + 1) / pasos.length) * 100}%`,
          }}
        />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2 md:grid-cols-4 lg:grid-cols-7">
        {pasos.map((paso, indice) => (
          <button
            key={paso}
            type="button"
            onClick={() => irAPaso(indice)}
            className={unirClases(
              "rounded-2xl border px-3 py-3 text-xs font-black transition",
              indice === pasoActual
                ? "border-lime-300 bg-lime-100 text-lime-950"
                : indice < pasoActual
                  ? "border-slate-200 bg-slate-50 text-slate-700 hover:bg-lime-50"
                  : "border-slate-200 bg-white text-slate-400 hover:bg-slate-50",
            )}
          >
            {indice + 1}. {paso}
          </button>
        ))}
      </div>
    </section>
  );
}

export default function PaginaOnboarding() {
  const router = useRouter();

  const [pasoActual, setPasoActual] = useState(0);

  const [nombre, setNombre] = useState("");
  const [objetivo, setObjetivo] = useState("");
  const [nivel, setNivel] = useState("");
  const [diasPorSemana, setDiasPorSemana] = useState(3);
  const [duracionSesion, setDuracionSesion] = useState(60);
  const [equiposSeleccionados, setEquiposSeleccionados] = useState<string[]>([]);
  const [molestias, setMolestias] = useState("");

  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [tipoMensaje, setTipoMensaje] = useState<"ok" | "error" | "info">(
    "info",
  );

  const molestiasResumen = molestias.trim() || "No indicadas";

  const pasoValido = useMemo(() => {
    if (pasoActual === 0) {
      return nombre.trim().length > 0;
    }

    if (pasoActual === 1) {
      return objetivo.length > 0;
    }

    if (pasoActual === 2) {
      return nivel.length > 0;
    }

    if (pasoActual === 3) {
      return (
        diasPorSemana >= 1 &&
        diasPorSemana <= 7 &&
        duracionSesion >= 15 &&
        duracionSesion <= 180
      );
    }

    if (pasoActual === 4) {
      return equiposSeleccionados.length > 0;
    }

    return true;
  }, [
    pasoActual,
    nombre,
    objetivo,
    nivel,
    diasPorSemana,
    duracionSesion,
    equiposSeleccionados.length,
  ]);

  function cambiarEquipo(equipo: string) {
    setEquiposSeleccionados((equiposActuales) => {
      if (equiposActuales.includes(equipo)) {
        return equiposActuales.filter((item) => item !== equipo);
      }

      return [...equiposActuales, equipo];
    });
  }

  function validarTodo() {
    if (!nombre.trim()) {
      setPasoActual(0);
      return "Introduce tu nombre.";
    }

    if (!objetivo) {
      setPasoActual(1);
      return "Selecciona un objetivo.";
    }

    if (!nivel) {
      setPasoActual(2);
      return "Selecciona tu nivel.";
    }

    if (diasPorSemana < 1 || diasPorSemana > 7) {
      setPasoActual(3);
      return "Los días por semana deben estar entre 1 y 7.";
    }

    if (duracionSesion < 15 || duracionSesion > 180) {
      setPasoActual(3);
      return "La duración por sesión debe estar entre 15 y 180 minutos.";
    }

    if (equiposSeleccionados.length === 0) {
      setPasoActual(4);
      return "Selecciona al menos un equipo disponible.";
    }

    return "";
  }

  function avanzar() {
    setMensaje("");

    if (!pasoValido) {
      setTipoMensaje("error");

      if (pasoActual === 0) {
        setMensaje("Introduce tu nombre para continuar.");
      } else if (pasoActual === 1) {
        setMensaje("Selecciona un objetivo para continuar.");
      } else if (pasoActual === 2) {
        setMensaje("Selecciona tu nivel para continuar.");
      } else if (pasoActual === 3) {
        setMensaje("Revisa los días por semana y la duración por sesión.");
      } else if (pasoActual === 4) {
        setMensaje("Selecciona al menos un equipo disponible.");
      }

      return;
    }

    setPasoActual((actual) => Math.min(actual + 1, pasos.length - 1));
  }

  function retroceder() {
    setMensaje("");
    setPasoActual((actual) => Math.max(actual - 1, 0));
  }

  async function guardarPerfil(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    const error = validarTodo();

    if (error) {
      setTipoMensaje("error");
      setMensaje(error);
      return;
    }

    try {
      setGuardando(true);
      setMensaje("");
      setTipoMensaje("info");

      const resultado = await guardarPerfilOnboarding({
        nombre: nombre.trim(),
        objetivo,
        nivel,
        dias_por_semana: diasPorSemana,
        duracion_sesion: duracionSesion,
        equipo_disponible: equiposSeleccionados.join(","),
        molestias: molestias.trim(),
      });

      if (!resultado.ok) {
        setTipoMensaje("error");
        setMensaje(resultado.error ?? "No se ha podido guardar el perfil.");
        return;
      }

      setTipoMensaje("ok");
      setMensaje("Perfil guardado correctamente. Generando rutina adaptada...");

      router.push("/rutina?modo=nueva");
      router.refresh();
    } catch {
      setTipoMensaje("error");
      setMensaje("Ha ocurrido un error al guardar el perfil.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <ContenedorApp ancho="detalle">
      <CabeceraPagina
        titulo="Configuración inicial"
        descripcion="Completa tu perfil paso a paso para que FitAdapt pueda generar una rutina adaptada a tu objetivo, nivel, disponibilidad, equipamiento y molestias."
        acciones={
          <div className="flex flex-wrap gap-3">
            <Link href="/inicio" className={estilos.boton.secundario}>
              Ir a inicio
            </Link>

            <Link href="/perfil" className={estilos.boton.primario}>
              Ver perfil
            </Link>
          </div>
        }
      />

      <form onSubmit={guardarPerfil} className="space-y-6">
        <IndicadorPasos pasoActual={pasoActual} irAPaso={setPasoActual} />

        <section className={estilos.tarjeta.base}>
          {pasoActual === 0 && (
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
              <div>
                <p className={estilos.texto.etiquetaVerde}>Usuario</p>

                <h2 className="mt-2 text-3xl font-black text-slate-950">
                  Datos básicos
                </h2>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                  Este dato se usa para personalizar la experiencia dentro de la
                  app. La personalización real se construye en los siguientes
                  pasos.
                </p>

                <div className="mt-6">
                  <Campo label="Nombre" ayuda="Ejemplo: Diego">
                    <input
                      type="text"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      className={estilos.input.base}
                      placeholder="Introduce tu nombre"
                    />
                  </Campo>
                </div>
              </div>

              <aside className={estilos.tarjeta.destacada}>
                <p className={estilos.texto.etiquetaVerde}>
                  Qué conseguiremos
                </p>

                <h3 className="mt-2 text-2xl font-black text-slate-950">
                  Un perfil preparado para generar rutinas
                </h3>

                <p className="mt-3 text-sm leading-6 text-slate-700">
                  Al terminar, FitAdapt tendrá datos suficientes para adaptar
                  ejercicios, volumen, duración y recomendaciones.
                </p>
              </aside>
            </div>
          )}

          {pasoActual === 1 && (
            <div>
              <p className={estilos.texto.etiquetaVerde}>Objetivo</p>

              <h2 className="mt-2 text-3xl font-black text-slate-950">
                Elige tu objetivo principal
              </h2>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                Esta decisión modifica el enfoque de la rutina: volumen,
                repeticiones, descansos, progresión y prioridad de ejercicios.
              </p>

              <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                {objetivos.map((opcion) => (
                  <TarjetaOpcion
                    key={opcion.valor}
                    titulo={opcion.titulo}
                    descripcion={opcion.descripcion}
                    activo={objetivo === opcion.valor}
                    onClick={() => setObjetivo(opcion.valor)}
                  />
                ))}
              </div>
            </div>
          )}

          {pasoActual === 2 && (
            <div>
              <p className={estilos.texto.etiquetaVerde}>Nivel</p>

              <h2 className="mt-2 text-3xl font-black text-slate-950">
                Indica tu experiencia
              </h2>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                El nivel ayuda a ajustar dificultad técnica, volumen de trabajo,
                progresión y selección de variantes.
              </p>

              <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                {niveles.map((opcion) => (
                  <TarjetaOpcion
                    key={opcion.valor}
                    titulo={opcion.titulo}
                    descripcion={opcion.descripcion}
                    activo={nivel === opcion.valor}
                    onClick={() => setNivel(opcion.valor)}
                  />
                ))}
              </div>
            </div>
          )}

          {pasoActual === 3 && (
            <div>
              <p className={estilos.texto.etiquetaVerde}>Disponibilidad</p>

              <h2 className="mt-2 text-3xl font-black text-slate-950">
                Define tiempo y frecuencia
              </h2>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                Estos datos permiten repartir la rutina por días y adaptar la
                cantidad de ejercicios por sesión.
              </p>

              <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
                <Campo
                  label="Días por semana"
                  ayuda="Debe estar entre 1 y 7 días."
                >
                  <input
                    type="number"
                    min={1}
                    max={7}
                    value={diasPorSemana}
                    onChange={(e) => setDiasPorSemana(Number(e.target.value))}
                    className={estilos.input.base}
                  />
                </Campo>

                <Campo
                  label="Duración por sesión"
                  ayuda="Debe estar entre 15 y 180 minutos."
                >
                  <input
                    type="number"
                    min={15}
                    max={180}
                    value={duracionSesion}
                    onChange={(e) => setDuracionSesion(Number(e.target.value))}
                    className={estilos.input.base}
                  />
                </Campo>
              </div>

              <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-bold text-slate-700">
                  Duraciones rápidas
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {duracionesRapidas.map((duracion) => (
                    <button
                      key={duracion}
                      type="button"
                      onClick={() => setDuracionSesion(duracion)}
                      className={unirClases(
                        "rounded-full border px-4 py-2 text-sm font-bold transition",
                        duracionSesion === duracion
                          ? "border-lime-300 bg-lime-100 text-lime-950"
                          : "border-slate-200 bg-white text-slate-600 hover:border-lime-300 hover:bg-lime-50",
                      )}
                    >
                      {duracion} min
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {pasoActual === 4 && (
            <div>
              <p className={estilos.texto.etiquetaVerde}>Equipamiento</p>

              <h2 className="mt-2 text-3xl font-black text-slate-950">
                Selecciona el material disponible
              </h2>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                La rutina evitará ejercicios incompatibles y priorizará
                alternativas que puedas realizar con el material seleccionado.
              </p>

              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {opcionesEquipamiento.map((equipo) => (
                  <ChipEquipo
                    key={equipo}
                    equipo={equipo}
                    activo={equiposSeleccionados.includes(equipo)}
                    onClick={() => cambiarEquipo(equipo)}
                  />
                ))}
              </div>

              <div className="mt-5 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-bold text-slate-700">
                  Seleccionados: {equiposSeleccionados.length}
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {equiposSeleccionados.length > 0
                    ? equiposSeleccionados.join(", ")
                    : "Todavía no has seleccionado equipamiento."}
                </p>
              </div>
            </div>
          )}

          {pasoActual === 5 && (
            <div>
              <p className={estilos.texto.etiquetaVerde}>Limitaciones</p>

              <h2 className="mt-2 text-3xl font-black text-slate-950">
                Indica molestias o lesiones
              </h2>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                Este paso ayuda a evitar movimientos conflictivos y a proponer
                alternativas más seguras.
              </p>

              <div className="mt-6">
                <Campo
                  label="Molestias actuales"
                  ayuda="Ejemplo: hombro derecho, rodilla izquierda, dolor lumbar, evitar saltos..."
                >
                  <textarea
                    value={molestias}
                    onChange={(e) => setMolestias(e.target.value)}
                    className={estilos.input.textarea}
                    rows={5}
                    placeholder="Ej. hombro derecho, rodilla izquierda..."
                  />
                </Campo>
              </div>

              <div className="mt-5 rounded-[1.5rem] border border-amber-200 bg-amber-50 p-5">
                <p className="text-sm font-black uppercase tracking-[0.16em] text-amber-800">
                  Impacto en la rutina
                </p>

                <p className="mt-2 text-sm leading-6 text-amber-900">
                  {molestias.trim()
                    ? `Restricción registrada: ${molestiasResumen}.`
                    : "No se han indicado molestias. La rutina no aplicará restricciones específicas por dolor o lesión."}
                </p>
              </div>
            </div>
          )}

          {pasoActual === 6 && (
            <div>
              <p className={estilos.texto.etiquetaVerde}>Resumen final</p>

              <h2 className="mt-2 text-3xl font-black text-slate-950">
                Revisa tu configuración
              </h2>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                Estos datos se guardarán y se usarán para generar la primera
                rutina personalizada.
              </p>

              <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                <TarjetaResumen
                  label="Nombre"
                  valor={nombre.trim() || "No indicado"}
                  ayuda="Identificación dentro de la app."
                />

                <TarjetaResumen
                  label="Objetivo"
                  valor={capitalizar(objetivo)}
                  ayuda="Enfoque principal de entrenamiento."
                />

                <TarjetaResumen
                  label="Nivel"
                  valor={capitalizar(nivel)}
                  ayuda="Dificultad y progresión."
                />

                <TarjetaResumen
                  label="Disponibilidad"
                  valor={`${diasPorSemana} días · ${duracionSesion} min`}
                  ayuda="Reparto semanal y duración."
                />

                <TarjetaResumen
                  label="Equipamiento"
                  valor={equiposSeleccionados.length}
                  ayuda={
                    equiposSeleccionados.length > 0
                      ? equiposSeleccionados.join(", ")
                      : "Sin equipamiento seleccionado."
                  }
                />

                <TarjetaResumen
                  label="Molestias"
                  valor={molestiasResumen}
                  ayuda="Restricciones para adaptar ejercicios."
                />
              </div>

              <div className="mt-6 rounded-[1.5rem] border border-lime-200 bg-lime-50 p-5">
                <p className="text-sm font-black uppercase tracking-[0.16em] text-lime-800">
                  Siguiente acción
                </p>

                <p className="mt-2 text-sm leading-6 text-lime-950">
                  Al guardar el perfil, FitAdapt te llevará a la generación de
                  rutina para crear un plan adaptado a esta configuración.
                </p>
              </div>
            </div>
          )}
        </section>

        <section className="sticky bottom-4 z-20 rounded-[2rem] border border-white/70 bg-white/95 p-4 shadow-2xl shadow-black/20 backdrop-blur">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-black text-slate-950">
                {pasos[pasoActual]}
              </p>

              <p className="mt-1 text-sm leading-6 text-slate-600">
                {pasoActual < pasos.length - 1
                  ? "Completa este paso y continúa con la configuración."
                  : "Guarda el perfil para generar tu rutina personalizada."}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {pasoActual > 0 && (
                <button
                  type="button"
                  onClick={retroceder}
                  className={estilos.boton.secundario}
                >
                  Atrás
                </button>
              )}

              {pasoActual < pasos.length - 1 ? (
                <button
                  type="button"
                  onClick={avanzar}
                  className={estilos.boton.primario}
                >
                  Continuar
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={guardando}
                  className={estilos.boton.primario}
                >
                  {guardando ? "Guardando..." : "Guardar y generar rutina"}
                </button>
              )}
            </div>
          </div>

          {mensaje && (
            <div
              className={unirClases(
                "mt-4 rounded-2xl border p-4 text-sm font-medium leading-6",
                tipoMensaje === "ok" &&
                  "border-lime-200 bg-lime-50 text-lime-900",
                tipoMensaje === "error" &&
                  "border-red-200 bg-red-50 text-red-900",
                tipoMensaje === "info" &&
                  "border-blue-200 bg-blue-50 text-blue-900",
              )}
            >
              {mensaje}
            </div>
          )}
        </section>
      </form>
    </ContenedorApp>
  );
}