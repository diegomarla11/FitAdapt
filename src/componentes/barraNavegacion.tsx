"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import BotonCerrarSesion from "@/componentes/botonCerrarSesion";
import { unirClases } from "@/lib/ui/estilos";

const enlaces = [
  { href: "/inicio", label: "Inicio" },
  { href: "/perfil", label: "Perfil" },
  { href: "/rutina", label: "Rutina" },
  { href: "/entrenamiento", label: "Entrenamiento" },
  { href: "/progreso", label: "Progreso" },
  { href: "/ejercicios", label: "Ejercicios" },
  { href: "/validacion", label: "Validación" },
];

export default function BarraNavegacion() {
  const pathname = usePathname();

  const rutasSinNavegacion = [
    "/login",
    "/recuperar-password",
    "/actualizar-password",
  ];

  if (rutasSinNavegacion.includes(pathname)) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-900/95 text-white shadow-lg shadow-black/20 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-center lg:gap-6">
          <div className="flex items-center justify-between gap-3">
            <Link href="/inicio" className="flex shrink-0 items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-lime-400 text-sm font-black text-slate-950 shadow-lg shadow-lime-400/25">
                F
              </span>

              <span>
                <span className="block text-sm font-black leading-4">
                  FitAdapt
                </span>
                <span className="block text-xs text-slate-400">
                  Entrenamiento personalizado
                </span>
              </span>
            </Link>

            <div className="block shrink-0 lg:hidden">
              <BotonCerrarSesion />
            </div>
          </div>

          <nav className="flex max-w-full items-center gap-1 overflow-x-auto rounded-full border border-white/10 bg-white/[0.07] p-1 scrollbar-thin">
            {enlaces.map((enlace) => {
              const activo =
                pathname === enlace.href ||
                (enlace.href !== "/inicio" && pathname.startsWith(enlace.href));

              return (
                <Link
                  key={enlace.href}
                  href={enlace.href}
                  className={unirClases(
                    "whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold transition",
                    activo
                      ? "bg-lime-400 text-slate-950 shadow-md shadow-lime-400/20"
                      : "text-slate-300 hover:bg-white/10 hover:text-white",
                  )}
                >
                  {enlace.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="hidden shrink-0 lg:block">
          <BotonCerrarSesion />
        </div>
      </div>
    </header>
  );
}