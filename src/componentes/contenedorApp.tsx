import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  ancho?: "normal" | "detalle" | "estrecho";
};

const anchos = {
  normal: "max-w-7xl",
  detalle: "max-w-6xl",
  estrecho: "max-w-4xl",
};

export default function ContenedorApp({ children, ancho = "normal" }: Props) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 px-4 py-6 text-slate-950 md:px-6 md:py-8 lg:px-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-180px] top-[-140px] h-[420px] w-[420px] rounded-full bg-lime-400/10 blur-3xl" />
        <div className="absolute right-[-220px] top-[220px] h-[460px] w-[460px] rounded-full bg-sky-500/10 blur-3xl" />
        <div className="absolute bottom-[-260px] left-[20%] h-[520px] w-[520px] rounded-full bg-violet-500/8 blur-3xl" />

        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.96),rgba(2,6,23,0.98)),radial-gradient(circle_at_top_left,rgba(255,255,255,0.08),transparent_34%)]" />
      </div>

      <div className={`relative mx-auto ${anchos[ancho]} space-y-6`}>
        {children}
      </div>
    </main>
  );
}