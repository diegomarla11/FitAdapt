import type { ReactNode } from "react";

type Props = {
  titulo: string;
  descripcion: string;
  acciones?: ReactNode;
  etiqueta?: string;
};

export default function CabeceraPagina({
  titulo,
  descripcion,
  acciones,
  etiqueta = "FitAdapt",
}: Props) {
  return (
    <section className="overflow-hidden rounded-[2rem] border border-white/60 bg-slate-50/95 shadow-xl shadow-black/10 backdrop-blur">
      <div className="grid gap-6 p-6 md:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-slate-500">
            <span className="h-2 w-2 rounded-full bg-lime-400" />
            {etiqueta}
          </div>

          <h1 className="text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
            {titulo}
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 md:text-base">
            {descripcion}
          </p>
        </div>

        {acciones && (
          <div className="flex flex-wrap gap-3 lg:justify-end">
            {acciones}
          </div>
        )}
      </div>
    </section>
  );
}