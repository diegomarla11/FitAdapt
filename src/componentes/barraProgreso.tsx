type Props = {
  etiqueta: string;
  valor: number;
  maximo?: number;
  detalle?: string;
};

export default function BarraProgreso({
  etiqueta,
  valor,
  maximo = 100,
  detalle,
}: Props) {
  const porcentaje =
    maximo > 0 ? Math.min(100, Math.max(0, (valor / maximo) * 100)) : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 text-sm">
        <p className="font-bold text-slate-800">{etiqueta}</p>

        <p className="text-xs font-bold text-slate-500">
          {detalle ?? `${Math.round(porcentaje)}%`}
        </p>
      </div>

      <div className="h-3 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
        <div
          className="h-full rounded-full bg-lime-400 transition-all duration-500"
          style={{ width: `${porcentaje}%` }}
        />
      </div>
    </div>
  );
}