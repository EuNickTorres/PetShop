import { UserCircleIcon } from "@phosphor-icons/react/dist/ssr/UserCircle";
import Link from "next/link";

const navLinks = [
  { href: "#servicios", label: "Servicios" },
  { href: "#sobre-nosotros", label: "Sobre nosotros" },
  { href: "#galeria", label: "Galería" },
  { href: "#contacto", label: "Contacto" },
];

export default function Header() {
  return (
    <header className="hero-intro-header absolute inset-x-0 top-0 z-20 text-brand-dark">
      <div className="mx-auto flex max-w-[88rem] items-center justify-between px-5 py-4 sm:px-8 lg:px-12">
        <Link href="#inicio" className="group text-brand-dark transition-opacity hover:opacity-70">
          <span className="editorial-logo block">Dayana</span>
          <span className="editorial-logo-subtitle">Peluquería en Tarragona</span>
        </Link>
        <nav aria-label="Navegación principal" className="hidden gap-8 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-brand-dark/75 lg:flex">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} className="transition hover:text-brand-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-4 focus-visible:ring-offset-background">
              {link.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href="/agenda"
            aria-label="Acceso privado a la agenda"
            title="Agenda privada"
            className="group/private flex size-10 shrink-0 items-center justify-center rounded-full border border-brand-dark/20 bg-background/55 text-brand-dark backdrop-blur-sm transition duration-300 hover:-translate-y-0.5 hover:border-brand-dark hover:bg-brand-dark hover:text-brand-light active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-4 focus-visible:ring-offset-background sm:size-11"
          >
            <UserCircleIcon
              aria-hidden="true"
              className="size-5 transition-transform duration-300 group-hover/private:scale-105 sm:size-[1.35rem]"
              weight="regular"
            />
          </Link>
          <a
            href="#contacto"
            className="rounded-full bg-brand-dark px-4 py-3 text-[0.65rem] font-extrabold uppercase tracking-[0.11em] text-brand-light shadow-[0_12px_28px_rgba(20,62,50,0.18)] transition hover:-translate-y-0.5 hover:bg-brand active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-4 focus-visible:ring-offset-background sm:px-5 sm:text-[0.68rem] sm:tracking-[0.13em]"
          >
            <span className="sm:hidden">Reservar</span>
            <span className="hidden sm:inline">Reservar cita</span>
          </a>
        </div>
      </div>
    </header>
  );
}
