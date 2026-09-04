export function unirClases(
  ...clases: Array<string | false | null | undefined>
) {
  return clases.filter(Boolean).join(" ");
}

export const estilos = {
  boton: {
    primario:
      "inline-flex items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-lime-400/30 disabled:cursor-not-allowed disabled:opacity-50",

    primarioGrande:
      "inline-flex items-center justify-center rounded-2xl bg-slate-950 px-6 py-4 text-base font-black text-white transition hover:-translate-y-0.5 hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-lime-400/30 disabled:cursor-not-allowed disabled:opacity-50",

    primarioSobreOscuro:
      "inline-flex items-center justify-center rounded-2xl bg-lime-400 px-5 py-3 text-sm font-bold text-slate-950 transition hover:-translate-y-0.5 hover:bg-lime-300 focus:outline-none focus:ring-4 focus:ring-lime-400/30 disabled:cursor-not-allowed disabled:opacity-50",

    secundario:
      "inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-950 transition hover:-translate-y-0.5 hover:border-lime-400 hover:bg-lime-50 focus:outline-none focus:ring-4 focus:ring-lime-400/20",

    ghost:
      "inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-100 focus:outline-none focus:ring-4 focus:ring-slate-200",

    peligro:
      "inline-flex items-center justify-center rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-bold text-red-800 transition hover:bg-red-100 focus:outline-none focus:ring-4 focus:ring-red-200",
  },

  tarjeta: {
    base:
      "rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8",

    suave:
      "rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 shadow-sm",

    metrica:
      "rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm",

    destacada:
      "rounded-[2rem] border border-lime-200 bg-lime-50 p-6 shadow-sm",

    info:
      "rounded-[1.5rem] border border-blue-200 bg-blue-50 p-5 shadow-sm",

    aviso:
      "rounded-[1.5rem] border border-amber-200 bg-amber-50 p-5 shadow-sm",

    error:
      "rounded-[1.5rem] border border-red-200 bg-red-50 p-5 shadow-sm",
  },

  input: {
    base:
      "w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-lime-500 focus:bg-white focus:ring-4 focus:ring-lime-500/15",

    textarea:
      "w-full resize-none rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-lime-500 focus:bg-white focus:ring-4 focus:ring-lime-500/15",

    select:
      "w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-lime-500 focus:bg-white focus:ring-4 focus:ring-lime-500/15",
  },

  texto: {
    etiqueta:
      "text-xs font-black uppercase tracking-[0.18em] text-slate-500",

    etiquetaVerde:
      "text-xs font-black uppercase tracking-[0.18em] text-lime-700",

    tituloSeccion:
      "text-2xl font-black tracking-tight text-slate-950",

    tituloPrincipal:
      "text-4xl font-black tracking-tight text-slate-950 md:text-5xl",

    descripcion:
      "text-sm leading-6 text-slate-600",

    descripcionGrande:
      "text-base leading-7 text-slate-600",
  },

  badge: {
    base:
      "inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-600",

    activo:
      "inline-flex items-center rounded-full border border-lime-200 bg-lime-100 px-3 py-1 text-xs font-bold text-lime-900",

    info:
      "inline-flex items-center rounded-full border border-blue-200 bg-blue-100 px-3 py-1 text-xs font-bold text-blue-900",

    aviso:
      "inline-flex items-center rounded-full border border-amber-200 bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900",

    error:
      "inline-flex items-center rounded-full border border-red-200 bg-red-100 px-3 py-1 text-xs font-bold text-red-900",
  },
};