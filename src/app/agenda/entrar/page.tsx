import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { hasValidAgendaSession } from "@/lib/agenda-auth";
import LoginMeshBackground from "@/components/agenda/LoginMeshBackground";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "Acceso a la agenda | Dayana Peluquería",
  robots: { index: false, follow: false },
};

export default async function AgendaLoginPage() {
  if (await hasValidAgendaSession()) redirect("/agenda");

  return (
    <main id="main-content" className="agenda-login-page">
      <LoginMeshBackground />
      <section className="agenda-login-shell" aria-labelledby="login-title">
        <Link href="/" className="agenda-wordmark" aria-label="Volver a Dayana Peluquería">
          <span>Dayana</span>
          <small>Peluquería</small>
        </Link>

        <div className="agenda-login-copy">
          <p>Área privada</p>
          <h1 id="login-title">Tu agenda, organizada.</h1>
          <span>Accede para consultar y preparar cada cita con calma.</span>
        </div>

        <LoginForm />
        <Link href="/" className="agenda-back-link">Volver al sitio</Link>
      </section>
    </main>
  );
}
