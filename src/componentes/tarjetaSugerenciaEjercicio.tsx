import {
  formatearSensacionEntrenamiento,
  obtenerSugerenciaEntrenamiento,
  type SensacionEntrenamiento,
} from "@/lib/entrenamiento/obtenerSugerenciaEntrenamiento";
import { estilos } from "@/lib/ui/estilos";

type UltimoRegistro = {
  series_reales: number | null;
  repeticiones_reales: string | null;
  peso_usado: number | null;
  sensacion: SensacionEntrenamiento;
};

type Props = {
  ultimoRegistro: UltimoRegistro;
};

function DatoSugerencia({
  label,
  valor,
}: {
  label: string;
  valor: string | number;
}) {
  return (
    <article className="rounded-[1.25rem] border border-blue-200 bg-white p-4">
      <p className="text-xs font-medium text-slate-500">{label}</p>

      <p className="mt-1 text-sm font-black text-slate-950">{valor}</p>
    </article>
  );
}

export default function TarjetaSugerenciaEjercicio({
  ultimoRegistro,
}: Props) {
  const sugerencia = obtenerSugerenciaEntrenamiento(ultimoRegistro.sensacion);

  return (
    <div className="mt-4 rounded-[1.5rem] border border-blue-200 bg-blue-50 p-5">
      <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-800">
            Datos sugeridos desde tu último registro
          </p>

          <h3 className="mt-2 text-xl font-black text-blue-950">
            {sugerencia.titulo}
          </h3>

          <p className="mt-2 text-sm leading-6 text-blue-900">
            {sugerencia.descripcion}
          </p>
        </div>

        <span className={estilos.badge.info}>
          {sugerencia.accion}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <DatoSugerencia
          label="Últimas series"
          valor={ultimoRegistro.series_reales ?? "-"}
        />

        <DatoSugerencia
          label="Últimas reps"
          valor={ultimoRegistro.repeticiones_reales ?? "-"}
        />

        <DatoSugerencia
          label="Último peso"
          valor={ultimoRegistro.peso_usado ?? "-"}
        />

        <DatoSugerencia
          label="Sensación"
          valor={formatearSensacionEntrenamiento(ultimoRegistro.sensacion)}
        />
      </div>
    </div>
  );
}