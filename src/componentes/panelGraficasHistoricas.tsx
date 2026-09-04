"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { estilos } from "@/lib/ui/estilos";

type PuntoEvolucion = {
  fecha: string;
  sesiones: number;
  ejercicios: number;
  seriesReales: number;
  pesoRegistrado: number;
  dolorMedio: number | null;
  fatigaMedia: number | null;
  cumplimiento: number;
  faciles: number;
  bien: number;
  dificiles: number;
};

type Props = {
  evolucion: PuntoEvolucion[];
};

function formatearFecha(fecha: string) {
  const partes = fecha.split("-");

  if (partes.length !== 3) {
    return fecha;
  }

  return `${partes[2]}/${partes[1]}`;
}

function prepararDatos(evolucion: PuntoEvolucion[]) {
  return evolucion.map((punto) => ({
    ...punto,
    fechaCorta: formatearFecha(punto.fecha),
    cumplimientoPorcentaje: Math.round(punto.cumplimiento * 100),
  }));
}

function ContenedorGrafica({
  etiqueta,
  titulo,
  descripcion,
  children,
  destacado = false,
}: {
  etiqueta: string;
  titulo: string;
  descripcion: string;
  children: React.ReactNode;
  destacado?: boolean;
}) {
  return (
    <article
      className={
        destacado
          ? "rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2"
          : "rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"
      }
    >
      <div className="mb-6">
        <p className={estilos.texto.etiquetaVerde}>{etiqueta}</p>

        <h2 className="mt-2 text-2xl font-black text-slate-950">{titulo}</h2>

        <p className="mt-2 text-sm leading-6 text-slate-600">{descripcion}</p>
      </div>

      {children}
    </article>
  );
}

export default function PanelGraficasHistoricas({ evolucion }: Props) {
  const datos = prepararDatos(evolucion);

  if (datos.length === 0) {
    return (
      <section className={estilos.tarjeta.base}>
        <p className={estilos.texto.etiquetaVerde}>Evolución</p>

        <h2 className="mt-2 text-2xl font-black text-slate-950">
          Evolución histórica
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-600">
          Todavía no hay suficientes sesiones para mostrar gráficas históricas.
        </p>
      </section>
    );
  }

  return (
    <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <ContenedorGrafica
        etiqueta="Volumen"
        titulo="Evolución de volumen"
        descripcion="Muestra cómo evolucionan las series reales y el peso registrado por fecha."
        destacado
      >
        <div className="h-80 min-h-80 min-w-0">
          <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
            <AreaChart data={datos}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="fechaCorta" stroke="#64748b" />
              <YAxis yAxisId="series" stroke="#64748b" />
              <YAxis yAxisId="peso" orientation="right" stroke="#64748b" />
              <Tooltip />
              <Area
                yAxisId="series"
                type="monotone"
                dataKey="seriesReales"
                name="Series reales"
                stroke="#0f172a"
                fill="#0f172a"
                fillOpacity={0.12}
              />
              <Area
                yAxisId="peso"
                type="monotone"
                dataKey="pesoRegistrado"
                name="Peso registrado"
                stroke="#2563eb"
                fill="#2563eb"
                fillOpacity={0.12}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </ContenedorGrafica>

      <ContenedorGrafica
        etiqueta="Cumplimiento"
        titulo="Cumplimiento por fecha"
        descripcion="Porcentaje de series reales frente a las series planificadas."
      >
        <div className="h-72 min-h-72 min-w-0">
          <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
            <LineChart data={datos}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="fechaCorta" stroke="#64748b" />
              <YAxis domain={[0, 120]} stroke="#64748b" />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="cumplimientoPorcentaje"
                name="Cumplimiento %"
                stroke="#0f172a"
                strokeWidth={3}
                dot
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </ContenedorGrafica>

      <ContenedorGrafica
        etiqueta="Carga interna"
        titulo="Dolor y fatiga"
        descripcion="Evolución media de dolor y fatiga registrados en cada fecha."
      >
        <div className="h-72 min-h-72 min-w-0">
          <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
            <LineChart data={datos}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="fechaCorta" stroke="#64748b" />
              <YAxis domain={[0, 10]} stroke="#64748b" />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="dolorMedio"
                name="Dolor medio"
                stroke="#991b1b"
                strokeWidth={3}
                dot
              />
              <Line
                type="monotone"
                dataKey="fatigaMedia"
                name="Fatiga media"
                stroke="#92400e"
                strokeWidth={3}
                dot
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </ContenedorGrafica>

      <ContenedorGrafica
        etiqueta="Sensaciones"
        titulo="Sensaciones registradas"
        descripcion="Comparativa diaria entre sensaciones fáciles, normales y difíciles."
        destacado
      >
        <div className="h-80 min-h-80 min-w-0">
          <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
            <BarChart data={datos}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="fechaCorta" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip />
              <Bar dataKey="faciles" name="Fácil" fill="#166534" />
              <Bar dataKey="bien" name="Bien" fill="#2563eb" />
              <Bar dataKey="dificiles" name="Difícil" fill="#991b1b" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ContenedorGrafica>
    </section>
  );
}