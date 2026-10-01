"use server";

import { redirect } from "next/navigation";
import {
  agendaAuthIsConfigured,
  clearAgendaSession,
  createAgendaSession,
  validateAgendaCredentials,
} from "@/lib/agenda-auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient as createSupabaseClient } from "@/lib/supabase/server";

export type LoginState = {
  error?: string;
};

export async function loginAgenda(
  _previousState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const identifier = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: identifier,
      password,
    });

    if (error) return { error: "Correo electrónico o contraseña incorrectos." };
    redirect("/agenda");
  }

  if (!agendaAuthIsConfigured()) {
    return { error: "El acceso todavía no está configurado." };
  }

  if (!validateAgendaCredentials(identifier, password)) {
    return { error: "Usuario o contraseña incorrectos." };
  }

  await createAgendaSession();
  redirect("/agenda");
}

export async function logoutAgenda() {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseClient();
    await supabase.auth.signOut();
  }
  await clearAgendaSession();
  redirect("/agenda/entrar");
}
