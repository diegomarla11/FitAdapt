"use client";

import { cerrarSesion } from "@/app/login/acciones";

export default function BotonCerrarSesion() {
  return (
    <form action={cerrarSesion}>
      <button
        type="submit"
        className="rounded-full border border-white/15 bg-white/10 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-white/20 focus:outline-none focus:ring-4 focus:ring-lime-400/20"
      >
        Cerrar sesión
      </button>
    </form>
  );
}