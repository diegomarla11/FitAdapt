"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { actualizarPerfil } from "@/app/perfil/acciones";
import type { Perfil } from "@/tipos/perfil";
import { opcionesEquipamiento } from "@/lib/shared/opcionesEquipamiento";
import { estilos, unirClases } from "@/lib/ui/estilos";

type Props = {
  perfil: Perfil;
};

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

function normalizarTexto(texto: string) {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function BloqueFormulario({
  etiqueta,
  titulo,
  descripcion,
  children,
}: {
  etiqueta: string;
  titulo: string;
  descripcion: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
      <div className="mb-5">
        <p className={estilos.texto.etiquetaVerde}>{etiqueta}</p>

        <h2 className="mt-2 text-2xl font-black text-slate-950">{titulo}</h2>

        <p className="mt-2 text-sm leading-6 text-slate-600">{descripcion}</p>
      </div>

      {children}
    </section>
  );
}

function Campo({
  label,
  ayuda,
  children,
}: {
  label: string;
  ayuda?: string;
  children: React.ReactNode;
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

function OpcionSeleccionable({
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

function ChipEquipamiento({
  opcion,
  activo,
  onClick,
}: {
  opcion: string;
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
      <span>{opcion}</span>

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

export default function FormularioPerfil({ perfil }: Props) {
  const router = useRouter();

  const equipamientoInicial = perfil.equipo_disponible
    ? perfil.equipo_disponible
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
    : [];

  const [nombre, setNombre] = useState(perfil.nombre || "");
  const [objetivo, setObjetivo] = useState(perfil.objetivo);
  const [nivel, setNivel] = useState(perfil.nivel);
  const [diasPorSemana, setDiasPorSemana] = useState(perfil.dias_por_semana);
  const [duracionSesion, setDuracionSesion] = useState(perfil.duracion_sesion);
  const [equipamientoSeleccionado, setEquipamientoSeleccionado] =
    useState<string[]>(equipamientoInicial);
  const [molestias, setMolestias] = useState(perfil.molestias || "");
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [tipoMensaje, setTipoMensaje] = useState<"ok" | "error" | "info">(
    "info",
  );

  function cambiarEquipamiento(opcion: string) {
    setEquipamientoSeleccionado((actual) => {
      if (actual.includes(opcion)) {
        return actual.filter((item) => item !== opcion);
      }

      return [...actual, opcion];
    });
  }

  async function guardarCambios(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    if (equipamientoSeleccionado.length === 0) {
      setTipoMensaje("error");
      setMensaje("Selecciona al menos un equipo disponible.");
      return;
    }

    if (diasPorSemana < 1 || diasPorSemana > 7) {
      setTipoMensaje("error");
      setMensaje("Los días por semana deben estar entre 1 y 7.");
      return;
    }

    if (duracionSesion < 15 || duracionSesion > 180) {
      setTipoMensaje("error");
      setMensaje("La duración por sesión debe estar entre 15 y 180 minutos.");
      return;
    }

    try {
      setGuardando(true);
      setMensaje("");
      setTipoMensaje("info");

      const resultado = await actualizarPerfil({
        id: perfil.id,
        nombre: nombre.trim(),
        objetivo,
        nivel,
        dias_por_semana: Number(diasPorSemana),
        duracion_sesion: Number(duracionSesion),
        equipo_disponible: equipamientoSeleccionado.join(","),
        molestias: molestias.trim(),
      });

      if (!resultado.ok) {
        setTipoMensaje("error");
        setMensaje(resultado.error || "No se ha podido guardar el perfil.");
        return;
      }

      setTipoMensaje("ok");
      setMensaje(
        "Perfil actualizado correctamente. Si has cambiado objetivo, nivel, días, equipamiento o molestias, conviene regenerar la rutina.",
      );

      router.refresh();
    } catch {
      setTipoMensaje("error");
      setMensaje("Ha ocurrido un error al guardar el perfil.");
    } finally {
      setGuardando(false);
    }
  }

  const resumenMolestias =
    molestias.trim().length > 0 ? molestias.trim() : "No indicadas";

  return (
    <form onSubmit={guardarCambios} className="space-y-5">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.45fr_0.75fr]">
          <div>
            <div className="mb-5">
              <p className={estilos.texto.etiquetaVerde}>Datos del usuario</p>

              <h2 className="mt-2 text-2xl font-black text-slate-950">
                Configuración base
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Define identidad, disponibilidad y duración para ajustar la rutina.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Campo
                label="Nombre"
                ayuda="Se usa para personalizar la experiencia."
              >
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className={estilos.input.base}
                  placeholder="Ej. Diego"
                />
              </Campo>

              <Campo label="Días por semana" ayuda="Distribución semanal.">
                <input
                  type="number"
                  min={1}
                  max={7}
                  value={diasPorSemana}
                  onChange={(e) => setDiasPorSemana(Number(e.target.value))}
                  className={estilos.input.base}
                />
              </Campo>

              <Campo label="Duración por sesión" ayuda="Entre 15 y 180 minutos.">
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

            <div className="mt-5 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-black text-slate-800">
                    Duraciones rápidas
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Ajusta la duración de la sesión sin escribir.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {duracionesRapidas.map((duracion) => (
                    <button
                      key={duracion}
                      type="button"
                      onClick={() => setDuracionSesion(duracion)}
                      className={unirClases(
                        "rounded-full border px-3 py-1.5 text-xs font-black transition",
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

            <div className="mt-5 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
              <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                    Disponibilidad
                  </p>
                  <p className="mt-1 font-black text-slate-950">
                    {diasPorSemana} días por semana
                  </p>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                    Duración
                  </p>
                  <p className="mt-1 font-black text-slate-950">
                    {duracionSesion} min por sesión
                  </p>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                    Equipamiento
                  </p>
                  <p className="mt-1 font-black text-slate-950">
                    {equipamientoSeleccionado.length} seleccionado
                  </p>
                </div>
              </div>
            </div>
          </div>

          <aside className="rounded-[1.75rem] border border-lime-200 bg-lime-50 p-5">
            <p className={estilos.texto.etiquetaVerde}>Resumen actual</p>

            <h2 className="mt-2 text-xl font-black text-slate-950">
              Uso del perfil
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-700">
              Determina volumen, ejercicios compatibles, duración y progresión.
            </p>

            <div className="mt-4 space-y-2">
              <div className="rounded-[1.1rem] border border-lime-200 bg-white p-3.5">
                <p className="text-xs font-medium text-slate-500">Objetivo</p>
                <p className="mt-1 text-base font-black text-slate-950">
                  {normalizarTexto(objetivo)}
                </p>
              </div>

              <div className="rounded-[1.1rem] border border-lime-200 bg-white p-3.5">
                <p className="text-xs font-medium text-slate-500">Nivel</p>
                <p className="mt-1 text-base font-black text-slate-950">
                  {normalizarTexto(nivel)}
                </p>
              </div>

              <div className="rounded-[1.1rem] border border-lime-200 bg-white p-3.5">
                <p className="text-xs font-medium text-slate-500">Sesiones</p>
                <p className="mt-1 text-base font-black text-slate-950">
                  {diasPorSemana} días · {duracionSesion} min
                </p>
              </div>

              <div className="rounded-[1.1rem] border border-lime-200 bg-white p-3.5">
                <p className="text-xs font-medium text-slate-500">Material</p>
                <p className="mt-1 text-base font-black text-slate-950">
                  {equipamientoSeleccionado.length} opciones
                </p>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <BloqueFormulario
        etiqueta="Objetivo"
        titulo="Objetivo principal"
        descripcion="El objetivo modifica la prioridad de ejercicios, rangos de repeticiones, volumen y descansos."
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {objetivos.map((opcion) => (
            <OpcionSeleccionable
              key={opcion.valor}
              titulo={opcion.titulo}
              descripcion={opcion.descripcion}
              activo={objetivo === opcion.valor}
              onClick={() => setObjetivo(opcion.valor)}
            />
          ))}
        </div>
      </BloqueFormulario>

      <BloqueFormulario
        etiqueta="Nivel"
        titulo="Experiencia de entrenamiento"
        descripcion="El nivel ayuda a decidir dificultad técnica, cantidad de trabajo y progresión de cargas."
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {niveles.map((opcion) => (
            <OpcionSeleccionable
              key={opcion.valor}
              titulo={opcion.titulo}
              descripcion={opcion.descripcion}
              activo={nivel === opcion.valor}
              onClick={() => setNivel(opcion.valor)}
            />
          ))}
        </div>
      </BloqueFormulario>

      <BloqueFormulario
        etiqueta="Equipamiento"
        titulo="Material disponible"
        descripcion="Selecciona el material que puedes utilizar. La rutina se adaptará evitando ejercicios incompatibles."
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {opcionesEquipamiento.map((opcion) => (
            <ChipEquipamiento
              key={opcion}
              opcion={opcion}
              activo={equipamientoSeleccionado.includes(opcion)}
              onClick={() => cambiarEquipamiento(opcion)}
            />
          ))}
        </div>

        <div className="mt-5 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
          <p className="text-sm font-bold text-slate-700">
            Seleccionados: {equipamientoSeleccionado.length}
          </p>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            {equipamientoSeleccionado.length > 0
              ? equipamientoSeleccionado.join(", ")
              : "Todavía no has seleccionado equipamiento."}
          </p>
        </div>
      </BloqueFormulario>

      <BloqueFormulario
        etiqueta="Limitaciones"
        titulo="Molestias o lesiones"
        descripcion="Este campo ayuda a evitar o sustituir ejercicios que puedan resultar incómodos."
      >
        <Campo
          label="Describe molestias actuales"
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

        <div className="mt-5 rounded-[1.5rem] border border-amber-200 bg-amber-50 p-5">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-amber-800">
            Impacto en la rutina
          </p>

          <p className="mt-2 text-sm leading-6 text-amber-900">
            {resumenMolestias === "No indicadas"
              ? "No se han indicado molestias. La rutina no aplicará restricciones específicas por dolor o lesión."
              : `Restricción registrada: ${resumenMolestias}. La rutina deberá priorizar ejercicios compatibles y alternativas más seguras.`}
          </p>
        </div>
      </BloqueFormulario>

      <section className="sticky bottom-4 z-20 rounded-[2rem] border border-white/70 bg-white/95 p-4 shadow-2xl shadow-black/20 backdrop-blur">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-black text-slate-950">
              Guardar configuración del perfil
            </p>

            <p className="mt-1 text-sm leading-6 text-slate-600">
              Si cambias objetivo, nivel, días, equipamiento o molestias, es
              recomendable regenerar la rutina.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={guardando}
              className={estilos.boton.primario}
            >
              {guardando ? "Guardando..." : "Guardar cambios"}
            </button>

            <Link href="/rutina?modo=nueva" className={estilos.boton.secundario}>
              Regenerar rutina
            </Link>
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
  );
}