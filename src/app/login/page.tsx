import { redirect } from "next/navigation";
import { crearClienteSupabaseServer } from "@/lib/supabase/server";
import { iniciarSesion, registrarse } from "./acciones";
import Link from "next/link";

export const dynamic = "force-dynamic";

type Props = {
  searchParams?: Promise<{
    error?: string;
    mensaje?: string;
  }>;
};

export default async function PaginaLogin({ searchParams }: Props) {
  const params = searchParams ? await searchParams : {};
  const error = params?.error ?? "";
  const mensaje = params?.mensaje ?? "";

  const supabase = await crearClienteSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/inicio");
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-120px] top-[-120px] h-[320px] w-[320px] rounded-full bg-lime-400/20 blur-3xl" />
        <div className="absolute bottom-[-160px] right-[-120px] h-[380px] w-[380px] rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.08),transparent_35%),linear-gradient(135deg,rgba(15,23,42,0.95),rgba(2,6,23,1))]" />
      </div>

      <div className="absolute left-6 top-6 z-10 flex items-center gap-3 md:left-10 md:top-8">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-lime-400 text-lg font-black text-slate-950 shadow-lg shadow-lime-400/20">
          F
        </div>
        <div>
          <p className="text-sm font-bold text-white">FitAdapt</p>
          <p className="text-xs text-slate-400">Sistema de entrenamiento</p>
        </div>
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-7xl items-center px-4 py-24 md:px-8">
        <div className="grid w-full gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <section className="space-y-8 lg:pt-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-lime-400" />
              FitAdapt · Entrenamiento personalizado
            </div>

            <div className="max-w-3xl">
              <h1 className="text-5xl font-black tracking-tight text-white md:text-6xl">
                Tu rutina, tu progreso, tu técnica.
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
                Crea tu perfil, genera una rutina adaptada a tu objetivo y
                registra cada sesión con métricas reales, progreso visual y
                validación técnica por vídeo mediante visión artificial.
              </p>
            </div>

            <div className="grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3">
              <article className="rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur transition hover:-translate-y-1 hover:bg-white/[0.13]">
                <p className="text-3xl font-black text-lime-300">01</p>
                <h2 className="mt-3 font-semibold text-white">Perfil</h2>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Objetivo, nivel, días, material y molestias.
                </p>
              </article>

              <article className="rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur transition hover:-translate-y-1 hover:bg-white/[0.13]">
                <p className="text-3xl font-black text-lime-300">02</p>
                <h2 className="mt-3 font-semibold text-white">Rutina</h2>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Plan adaptado con ejercicios compatibles.
                </p>
              </article>

              <article className="rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur transition hover:-translate-y-1 hover:bg-white/[0.13]">
                <p className="text-3xl font-black text-lime-300">03</p>
                <h2 className="mt-3 font-semibold text-white">Progreso</h2>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Sesiones, fatiga, dolor, peso y evolución.
                </p>
              </article>
            </div>

            <div className="grid max-w-3xl grid-cols-2 gap-4 md:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-2xl font-black text-white">119</p>
                <p className="mt-1 text-xs uppercase tracking-wide text-slate-400">
                  ejercicios
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-2xl font-black text-white">Vídeo</p>
                <p className="mt-1 text-xs uppercase tracking-wide text-slate-400">
                  validación técnica
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-2xl font-black text-white">Texto</p>
                <p className="mt-1 text-xs uppercase tracking-wide text-slate-400">
                  ajuste natural
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-2xl font-black text-white">100%</p>
                <p className="mt-1 text-xs uppercase tracking-wide text-slate-400">
                  personalizado
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-white/10 bg-white p-6 text-slate-950 shadow-2xl md:p-8">
            <div className="mb-8">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-lime-600">
                Acceso
              </p>
              <h2 className="mt-2 text-3xl font-black tracking-tight">
                Entra a tu panel
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Inicia sesión o crea una cuenta para guardar tu perfil, tus
                rutinas y tus entrenamientos.
              </p>
            </div>

            {error && (
              <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
                {error}
              </div>
            )}

            {mensaje && (
              <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-700">
                {mensaje}
              </div>
            )}

            <div className="space-y-8">
              <form action={iniciarSesion} className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-lime-500 focus:bg-white focus:ring-4 focus:ring-lime-500/15"
                    placeholder="tuemail@ejemplo.com"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Contraseña
                  </label>
                  <input
                    type="password"
                    name="password"
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-lime-500 focus:bg-white focus:ring-4 focus:ring-lime-500/15"
                    placeholder="******"
                    required
                  />
                </div>

                <div className="text-right">
                  <Link
                    href="/recuperar-password"
                    className="text-sm font-semibold text-slate-500 hover:text-slate-950"
                  >
                    He olvidado mi contraseña
                  </Link>
                </div>

                <button
                  type="submit"
                  className="w-full rounded-2xl bg-slate-950 px-5 py-4 font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-lime-500/30"
                >
                  Iniciar sesión
                </button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-4 text-sm text-slate-500">
                    o crea una cuenta
                  </span>
                </div>
              </div>

              <form action={registrarse} className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-lime-500 focus:bg-white focus:ring-4 focus:ring-lime-500/15"
                    placeholder="tuemail@ejemplo.com"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Contraseña
                  </label>
                  <input
                    type="password"
                    name="password"
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-lime-500 focus:bg-white focus:ring-4 focus:ring-lime-500/15"
                    placeholder="mínimo 6 caracteres"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-4 font-semibold text-slate-950 transition hover:-translate-y-0.5 hover:border-lime-500 hover:bg-lime-50 focus:outline-none focus:ring-4 focus:ring-lime-500/30"
                >
                  Crear cuenta
                </button>
              </form>
            </div>

            <div className="mt-6 rounded-2xl bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-800">
                Qué incluye la app
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full bg-lime-100 px-3 py-1 text-xs font-semibold text-lime-800">
                  Rutinas
                </span>
                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
                  Progreso
                </span>
                <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-800">
                  Visión artificial
                </span>
                <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
                  Texto natural
                </span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}