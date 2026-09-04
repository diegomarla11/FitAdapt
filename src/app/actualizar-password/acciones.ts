"use server";

import { redirect } from "next/navigation";
import { crearClienteSupabaseServer } from "@/lib/supabase/server";

export async function actualizarPassword(formData: FormData): Promise<void> {
  const password = String(formData.get("password") ?? "").trim();
  const confirmarPassword = String(formData.get("confirmarPassword") ?? "").trim();

  if (!password || !confirmarPassword) {
    redirect(
      "/actualizar-password?error=Debes%20rellenar%20ambos%20campos.",
    );
  }

  if (password.length < 6) {
    redirect(
      "/actualizar-password?error=La%20contrase%C3%B1a%20debe%20tener%20al%20menos%206%20caracteres.",
    );
  }

  if (password !== confirmarPassword) {
    redirect(
      "/actualizar-password?error=Las%20contrase%C3%B1as%20no%20coinciden.",
    );
  }

  const supabase = await crearClienteSupabaseServer();

  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    redirect(`/actualizar-password?error=${encodeURIComponent(error.message)}`);
  }

  redirect(
    "/login?mensaje=Contrase%C3%B1a%20actualizada%20correctamente.%20Ya%20puedes%20iniciar%20sesi%C3%B3n.",
  );
}