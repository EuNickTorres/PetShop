"use server";

import { redirect } from "next/navigation";
import {
  agendaAuthIsConfigured,
  clearAgendaSession,
  createAgendaSession,
  validateAgendaCredentials,
} from "@/lib/agenda-auth";

export type LoginState = {
  error?: string;
};

export async function loginAgenda(
  _previousState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  if (!agendaAuthIsConfigured()) {
    return { error: "El acceso todavía no está configurado." };
  }

  const username = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!validateAgendaCredentials(username, password)) {
    return { error: "Usuario o contraseña incorrectos." };
  }

  await createAgendaSession();
  redirect("/agenda");
}

export async function logoutAgenda() {
  await clearAgendaSession();
  redirect("/agenda/entrar");
}
