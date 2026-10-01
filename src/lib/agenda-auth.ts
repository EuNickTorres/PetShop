import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient as createSupabaseClient } from "@/lib/supabase/server";

const SESSION_COOKIE = "dayana_agenda_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 14;

function getCredentials() {
  return {
    username: process.env.AGENDA_USERNAME ?? "dayana",
    password: process.env.AGENDA_PASSWORD ?? "",
  };
}

function getSecret() {
  return process.env.AGENDA_SESSION_SECRET ?? process.env.AGENDA_PASSWORD ?? "";
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) return false;
  return timingSafeEqual(leftBuffer, rightBuffer);
}

function sign(payload: string) {
  return createHmac("sha256", getSecret()).update(payload).digest("hex");
}

export function agendaAuthIsConfigured() {
  const credentials = getCredentials();
  return Boolean(credentials.password && getSecret());
}

export function validateAgendaCredentials(username: string, password: string) {
  if (!agendaAuthIsConfigured()) return false;

  const credentials = getCredentials();
  return safeEqual(username.trim().toLowerCase(), credentials.username.toLowerCase()) &&
    safeEqual(password, credentials.password);
}

export async function createAgendaSession() {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS;
  const payload = `dayana:${expiresAt}`;
  const token = `${payload}.${sign(payload)}`;
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DURATION_SECONDS,
    path: "/",
  });
}

export async function clearAgendaSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function hasValidAgendaSession() {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseClient();
    const { data, error } = await supabase.auth.getClaims();
    return Boolean(!error && data?.claims?.sub);
  }

  if (!agendaAuthIsConfigured()) return false;

  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return false;

  const parts = token.split(".");
  if (parts.length !== 2) return false;

  const [payload, signature] = parts;
  const [, expiresAt] = payload.split(":");
  if (!expiresAt || Number(expiresAt) < Math.floor(Date.now() / 1000)) return false;

  return safeEqual(signature, sign(payload));
}
