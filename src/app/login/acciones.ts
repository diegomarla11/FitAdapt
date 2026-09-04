"use server";

import { redirect } from "next/navigation";
import { crearClienteSupabaseServer } from "@/lib/supabase/server";

function obtenerSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export async function iniciarSesion(formData: FormData): Promise<void> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "").trim();

  if (!email || !password) {
    redirect("/login?error=Debes%20rellenar%20email%20y%20contrase%C3%B1a.");
  }

  const supabase = await crearClienteSupabaseServer();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect(
      "/login?error=Credenciales%20incorrectas%2C%20correo%20sin%20confirmar%20o%20usuario%20inexistente.",
    );
  }

  redirect("/inicio");
}

export async function registrarse(formData: FormData): Promise<void> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "").trim();

  if (!email || !password) {
    redirect("/login?error=Debes%20rellenar%20email%20y%20contrase%C3%B1a.");
  }

  if (password.length < 6) {
    redirect(
      "/login?error=La%20contrase%C3%B1a%20debe%20tener%20al%20menos%206%20caracteres.",
    );
  }

  const supabase = await crearClienteSupabaseServer();
  const siteUrl = obtenerSiteUrl();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${siteUrl}/auth/callback?next=/inicio`,
    },
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  if (!data.user) {
    redirect("/login?error=No%20se%20ha%20creado%20el%20usuario.");
  }

  if (data.user.identities && data.user.identities.length === 0) {
    redirect("/login?error=Ese%20email%20ya%20est%C3%A1%20registrado.");
  }

  redirect(
    "/login?mensaje=Cuenta%20creada%20correctamente.%20Revisa%20tu%20correo%20para%20confirmar%20la%20cuenta%20antes%20de%20iniciar%20sesi%C3%B3n.",
  );
}

export async function cerrarSesion(): Promise<void> {
  const supabase = await crearClienteSupabaseServer();
  await supabase.auth.signOut();
  redirect("/login");
}