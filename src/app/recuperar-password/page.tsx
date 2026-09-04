import Link from "next/link";
import { enviarCorreoRecuperacion } from "./acciones";

export const dynamic = "force-dynamic";

type Props = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

export default async function PaginaRecuperarPassword({
  searchParams,
}: Props) {
  const params = searchParams ? await searchParams : {};
  const error = params?.error ?? "";

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12">
      <section className="w-full max-w-md rounded-[2rem] border border-white/10 bg-white p-6 text-slate-950 shadow-2xl md:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-lime-600">
          Recuperación
        </p>

        <h1 className="mt-2 text-3xl font-black">Recuperar contraseña</h1>

        <p className="mt-3 text-sm leading-6 text-slate-600">
          Introduce tu email y te enviaremos un enlace para crear una nueva
          contraseña.
        </p>

        {error && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        <form action={enviarCorreoRecuperacion} className="mt-6 space-y-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Email
            </label>

            <input
              type="email"
              name="email"
              required
              className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-lime-500 focus:bg-white focus:ring-4 focus:ring-lime-500/15"
              placeholder="tuemail@ejemplo.com"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-2xl bg-slate-950 px-5 py-4 font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-lime-500/30"
          >
            Enviar enlace
          </button>
        </form>

        <Link
          href="/login"
          className="mt-5 inline-block text-sm font-semibold text-slate-600 hover:text-slate-950"
        >
          Volver al login
        </Link>
      </section>
    </main>
  );
}