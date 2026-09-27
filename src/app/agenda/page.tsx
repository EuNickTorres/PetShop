import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { hasValidAgendaSession } from "@/lib/agenda-auth";
import AgendaApp from "@/components/agenda/AgendaApp";

export const metadata: Metadata = {
  title: "Agenda privada | Dayana Peluquería",
  robots: { index: false, follow: false },
};

export default async function AgendaPage() {
  if (!(await hasValidAgendaSession())) redirect("/agenda/entrar");

  return <AgendaApp />;
}
