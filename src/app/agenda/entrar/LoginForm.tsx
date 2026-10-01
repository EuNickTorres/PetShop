"use client";

import { useActionState } from "react";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { loginAgenda, type LoginState } from "../actions";

const initialState: LoginState = {};

export default function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAgenda, initialState);
  const usesSupabase = isSupabaseConfigured();

  return (
    <form action={formAction} className="agenda-login-form">
      <div className="agenda-field">
        <label htmlFor="username">{usesSupabase ? "Correo electrónico" : "Usuario"}</label>
        <input
          id="username"
          name="username"
          type={usesSupabase ? "email" : "text"}
          autoComplete="username"
          autoFocus
          required
        />
      </div>

      <div className="agenda-field">
        <label htmlFor="password">Contraseña</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>

      {state.error ? <p className="agenda-form-error" role="alert">{state.error}</p> : null}

      <button className="agenda-primary-button" type="submit" disabled={isPending}>
        {isPending ? "Entrando..." : "Entrar en la agenda"}
      </button>
    </form>
  );
}
