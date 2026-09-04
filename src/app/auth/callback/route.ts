import { NextResponse } from "next/server";
import { crearClienteSupabaseServer } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);

  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/inicio";

  const error = requestUrl.searchParams.get("error");
  const errorDescription = requestUrl.searchParams.get("error_description");

  if (error) {
    return NextResponse.redirect(
      new URL(
        `/login?error=${encodeURIComponent(
          errorDescription ??
            "El enlace no es válido o ha caducado. Solicita uno nuevo.",
        )}`,
        requestUrl.origin,
      ),
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL(
        "/login?error=El enlace de autenticación no contiene código válido.",
        requestUrl.origin,
      ),
    );
  }

  const supabase = await crearClienteSupabaseServer();

  const { error: errorIntercambio } =
    await supabase.auth.exchangeCodeForSession(code);

  if (errorIntercambio) {
    return NextResponse.redirect(
      new URL(
        `/login?error=${encodeURIComponent(
          "No se ha podido validar el enlace. Solicita uno nuevo.",
        )}`,
        requestUrl.origin,
      ),
    );
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}