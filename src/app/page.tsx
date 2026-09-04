import { redirect } from "next/navigation";
import { crearClienteSupabaseServer } from "@/lib/supabase/server";

export default async function PaginaPrincipal() {
  const supabase = await crearClienteSupabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/inicio");
  }

  redirect("/login");
}