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
        <a
          href="#contacto"
          className="rounded-full bg-brand-dark px-5 py-3 text-[0.68rem] font-extrabold uppercase tracking-[0.13em] text-brand-light shadow-[0_12px_28px_rgba(20,62,50,0.18)] transition hover:-translate-y-0.5 hover:bg-brand active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-4 focus-visible:ring-offset-background"
        >
          Reservar cita
        </a>
      </div>
    </header>
  );
}
