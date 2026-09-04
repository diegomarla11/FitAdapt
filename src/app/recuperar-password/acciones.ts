"use server";

import { redirect } from "next/navigation";
import { crearClienteSupabaseServer } from "@/lib/supabase/server";

function obtenerSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export async function enviarCorreoRecuperacion(
  formData: FormData,
): Promise<void> {
  const email = String(formData.get("email") ?? "").trim();

  if (!email) {
    redirect("/recuperar-password?error=Introduce%20tu%20email.");
  }

  const supabase = await crearClienteSupabaseServer();
  const siteUrl = obtenerSiteUrl();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/auth/callback?next=/actualizar-password`,
  });

  if (error) {
    redirect(`/recuperar-password?error=${encodeURIComponent(error.message)}`);
  }

  redirect(
    "/login?mensaje=Si%20el%20correo%20existe%2C%20recibir%C3%A1s%20un%20enlace%20para%20cambiar%20la%20contrase%C3%B1a.",
  );
}