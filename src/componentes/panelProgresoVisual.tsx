import BarraProgreso from "@/componentes/barraProgreso";
import { estilos } from "@/lib/ui/estilos";

type ResumenGlobal = {
  sesionesTotales: number;
  ejerciciosTotales: number;
  seriesTotales: number;
  pesoTotalRegistrado: number;
  sensacionesFaciles: number;
  sensacionesDificiles: number;
};

type ResumenGrupo = {
  grupo?: string;
  grupoMuscular?: string;
  apariciones: number;
  cumplimiento: number;
  ratioSeries: number;
  sensacionDominante: string;
};

type ResumenEjercicio = {
  ejercicio?: string;
  nombreEjercicio?: string;
  grupo: string;
  apariciones: number;
  cumplimiento: number;
  ratioSeries: number;
  pesoMedio: number | null;
  dolorMedio: number | null;
  fatigaMedia: number | null;
  descansoRecomendadoMedio: number | null;
  descansoRealMedio: number | null;
  ratioDescanso: number | null;
  estado: string;
};

type Props = {
  resumenGlobal: ResumenGlobal | null;
  resumenPorGrupo: ResumenGrupo[];
  resumenPorEjercicio: ResumenEjercicio[];
};

function formatearPorcentaje(valor: number) {
  return `${Math.round(valor)}%`;
}

function formatearRatio(valor: number | null) {
  if (valor === null || !Number.isFinite(valor)) {
    return "-";
  }

  return valor.toFixed(2);
}

function formatearNumero(valor: number | null, decimales = 1) {
  if (valor === null || !Number.isFinite(valor)) {
    return "-";
  }

  return valor.toFixed(decimales);
}

function formatearSegundos(valor: number | null) {
  if (valor === null || !Number.isFinite(valor)) {
    return "-";
  }

  return `${Math.round(valor)} s`;
}

function obtenerNombreEjercicio(ejercicio: ResumenEjercicio) {
  return ejercicio.ejercicio ?? ejercicio.nombreEjercicio ?? "Ejercicio";
}

function TarjetaAnalisis({
  etiqueta,
  titulo,
  descripcion,
  children,
  anchoCompleto = false,
}: {
  etiqueta: string;
  titulo: string;
  descripcion: string;
  children: React.ReactNode;
  anchoCompleto?: boolean;
}) {
  return (
    <article
      className={
        anchoCompleto
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

export default function PanelProgresoVisual({
  resumenGlobal,
  resumenPorGrupo,
  resumenPorEjercicio,
}: Props) {
  const totalSensaciones =
    (resumenGlobal?.sensacionesFaciles ?? 0) +
    (resumenGlobal?.sensacionesDificiles ?? 0);

  const ejerciciosOrdenados = [...resumenPorEjercicio]
    .sort((a, b) => b.apariciones - a.apariciones)
    .slice(0, 8);

  const ejerciciosConDolor = [...resumenPorEjercicio]
    .filter((ejercicio) => ejercicio.dolorMedio !== null)
    .sort((a, b) => (b.dolorMedio ?? 0) - (a.dolorMedio ?? 0))
    .slice(0, 6);

  const ejerciciosConFatiga = [...resumenPorEjercicio]
    .filter((ejercicio) => ejercicio.fatigaMedia !== null)
    .sort((a, b) => (b.fatigaMedia ?? 0) - (a.fatigaMedia ?? 0))
    .slice(0, 6);

  const ejerciciosConDescanso = [...resumenPorEjercicio]
    .filter((ejercicio) => ejercicio.ratioDescanso !== null)
    .sort((a, b) => (b.ratioDescanso ?? 0) - (a.ratioDescanso ?? 0))
    .slice(0, 6);

  return (
    <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <TarjetaAnalisis
        etiqueta="Sensaciones"
        titulo="Distribución de sensaciones"
        descripcion="Relación entre ejercicios registrados como fáciles o difíciles."
      >
        <div className="space-y-4">
          <BarraProgreso
            etiqueta="Sensación fácil"
            valor={resumenGlobal?.sensacionesFaciles ?? 0}
            maximo={totalSensaciones || 1}
            detalle={`${resumenGlobal?.sensacionesFaciles ?? 0} registros`}
          />

          <BarraProgreso
            etiqueta="Sensación difícil"
            valor={resumenGlobal?.sensacionesDificiles ?? 0}
            maximo={totalSensaciones || 1}
            detalle={`${resumenGlobal?.sensacionesDificiles ?? 0} registros`}
          />
        </div>
      </TarjetaAnalisis>

      <TarjetaAnalisis
        etiqueta="Grupos"
        titulo="Cumplimiento por grupo muscular"
        descripcion="Porcentaje de ejercicios completados agrupados por zona muscular."
      >
        <div className="space-y-4">
          {resumenPorGrupo.length === 0 ? (
            <p className="text-sm text-slate-600">
              Todavía no hay datos suficientes para mostrar este resumen.
            </p>
          ) : (
            resumenPorGrupo.map((grupo) => (
              <BarraProgreso
                key={grupo.grupo ?? grupo.grupoMuscular ?? "grupo"}
                etiqueta={grupo.grupo ?? grupo.grupoMuscular ?? "Grupo no indicado"}
                valor={grupo.cumplimiento}
                maximo={100}
                detalle={`${formatearPorcentaje(grupo.cumplimiento)} · ${
                  grupo.sensacionDominante
                }`}
              />
            ))
          )}
        </div>
      </TarjetaAnalisis>

      <TarjetaAnalisis
        etiqueta="Series"
        titulo="Ratio de series por ejercicio"
        descripcion="Compara las series reales frente a las series planificadas. Un valor cercano a 1.00 indica que se realizó lo previsto."
        anchoCompleto
      >
        <div className="space-y-4">
          {ejerciciosOrdenados.length === 0 ? (
            <p className="text-sm text-slate-600">
              Todavía no hay ejercicios registrados.
            </p>
          ) : (
            ejerciciosOrdenados.map((ejercicio) => (
              <BarraProgreso
                etiqueta={obtenerNombreEjercicio(ejercicio)}
                key={`${obtenerNombreEjercicio(ejercicio)}-${ejercicio.grupo}-series`}
                valor={ejercicio.ratioSeries}
                maximo={1.5}
                detalle={`Ratio ${formatearRatio(ejercicio.ratioSeries)} · ${
                  ejercicio.estado
                }`}
              />
            ))
          )}
        </div>
      </TarjetaAnalisis>

      <TarjetaAnalisis
        etiqueta="Dolor"
        titulo="Dolor medio por ejercicio"
        descripcion="Escala de 0 a 10. Valores altos pueden provocar cambios de variante en futuras rutinas."
      >
        <div className="space-y-4">
          {ejerciciosConDolor.length === 0 ? (
            <p className="text-sm text-slate-600">
              Todavía no hay datos de dolor registrados.
            </p>
          ) : (
            ejerciciosConDolor.map((ejercicio) => (
              <BarraProgreso
                etiqueta={obtenerNombreEjercicio(ejercicio)}
                key={`${obtenerNombreEjercicio(ejercicio)}-${ejercicio.grupo}-dolor`}
                valor={ejercicio.dolorMedio ?? 0}
                maximo={10}
                detalle={`Dolor ${formatearNumero(ejercicio.dolorMedio)} · ${
                  ejercicio.estado
                }`}
              />
            ))
          )}
        </div>
      </TarjetaAnalisis>

      <TarjetaAnalisis
        etiqueta="Fatiga"
        titulo="Fatiga media por ejercicio"
        descripcion="Escala de 0 a 10. Valores altos indican acumulación de esfuerzo o recuperación insuficiente."
      >
        <div className="space-y-4">
          {ejerciciosConFatiga.length === 0 ? (
            <p className="text-sm text-slate-600">
              Todavía no hay datos de fatiga registrados.
            </p>
          ) : (
            ejerciciosConFatiga.map((ejercicio) => (
              <BarraProgreso
                etiqueta={obtenerNombreEjercicio(ejercicio)}
                key={`${obtenerNombreEjercicio(ejercicio)}-${ejercicio.grupo}-fatiga`}
                valor={ejercicio.fatigaMedia ?? 0}
                maximo={10}
                detalle={`Fatiga ${formatearNumero(ejercicio.fatigaMedia)} · ${
                  ejercicio.estado
                }`}
              />
            ))
          )}
        </div>
      </TarjetaAnalisis>

      <TarjetaAnalisis
        etiqueta="Descanso"
        titulo="Descanso real frente al recomendado"
        descripcion="Un ratio superior a 1.00 indica que el descanso real fue mayor que el recomendado."
        anchoCompleto
      >
        <div className="space-y-4">
          {ejerciciosConDescanso.length === 0 ? (
            <p className="text-sm text-slate-600">
              Todavía no hay datos de descanso suficientes.
            </p>
          ) : (
            ejerciciosConDescanso.map((ejercicio) => (
              <BarraProgreso
                etiqueta={obtenerNombreEjercicio(ejercicio)}
                key={`${obtenerNombreEjercicio(ejercicio)}-${ejercicio.grupo}-descanso`}
                valor={ejercicio.ratioDescanso ?? 0}
                maximo={2}
                detalle={`Ratio ${formatearRatio(
                  ejercicio.ratioDescanso,
                )} · recomendado ${formatearSegundos(
                  ejercicio.descansoRecomendadoMedio,
                )} · real ${formatearSegundos(
                  ejercicio.descansoRealMedio,
                )}`}
              />
            ))
          )}
        </div>
      </TarjetaAnalisis>
    </section>
  );
}