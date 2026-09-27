import { siteConfig } from "@/lib/site-config";
import WhatsAppButton from "./WhatsAppButton";

export default function Contact() {
  return (
    <section id="contacto" className="px-5 pb-24 pt-6 sm:px-6 md:pb-36">
      <div data-reveal className="contact-shell mx-auto grid max-w-6xl overflow-hidden rounded-[2.4rem] md:grid-cols-[0.95fr_1.05fr]">
        <div className="contact-primary p-8 sm:p-12 md:p-14">
          <p className="section-kicker">Contacto</p>
          <h2 className="mt-4 text-4xl font-bold leading-[1.02] tracking-[-0.045em] [text-wrap:balance] sm:text-5xl">¿Reservamos una cita?</h2>
          <p className="mt-5 max-w-md text-base leading-7 text-foreground/72">
            Cuéntanos cómo es tu mascota y qué cuidado necesita. Te responderemos por WhatsApp.
          </p>
          <WhatsAppButton className="mt-8" />
          {siteConfig.email && (
            <a href={`mailto:${siteConfig.email}`} className="mt-6 inline-block text-sm font-semibold underline underline-offset-4">
              {siteConfig.email}
            </a>
          )}
        </div>
        <div className="contact-secondary p-8 text-foreground sm:p-12 md:p-14">
          <h3 className="mt-4 text-2xl font-bold tracking-[-0.03em]">Horarios y ubicación</h3>
          <ul className="mt-7 space-y-3 text-sm text-foreground/85">
            {siteConfig.hours.map((h) => (
              <li key={h.days} className="flex justify-between gap-4 border-b border-brand-dark/10 pb-3">
                <span className="font-semibold">{h.days}</span>
                <span className="text-right">{h.time}</span>
              </li>
            ))}
          </ul>
          <p className="mt-8 text-sm leading-6 text-foreground/80">
            {siteConfig.address.street}
            <br />
            {siteConfig.address.city}
          </p>
          <a
            href={siteConfig.address.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-brand-dark underline decoration-brand/40 underline-offset-4 transition hover:decoration-brand-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            Ver cómo llegar <span aria-hidden>↗</span>
          </a>
        </div>
      </div>
    </section>
  );
}
