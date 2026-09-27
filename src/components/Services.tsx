import { services } from "@/lib/site-config";

export default function Services() {
  return (
    <section id="servicios" className="services-section">
      <div className="services-layout mx-auto max-w-6xl px-5 sm:px-6">
        <div data-reveal className="services-intro">
          <p className="section-kicker">Servicios</p>
          <h2 className="services-heading mt-4 text-4xl font-bold leading-[1.02] tracking-[-0.045em] text-foreground [text-wrap:balance] sm:text-5xl">
            Todo lo que necesita para sentirse bien.
          </h2>
          <p className="mt-6 max-w-sm text-base leading-7 text-foreground/78">
            Cada servicio se adapta a la piel, el pelo y el ritmo de tu mascota.
          </p>
          <p className="services-promise">
            <span>Sin prisas</span>
            <span>Con cariño</span>
          </p>
          <a href="#contacto" className="services-link focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-4 focus-visible:ring-offset-background">
            Consulta y reserva <span aria-hidden>↗</span>
          </a>
        </div>
        <div data-reveal data-reveal-delay="1" className="service-list">
          {services.map((service, index) => (
            <article key={service.title} className="service-item group">
              <span className="service-number" aria-hidden>{String(index + 1).padStart(2, "0")}</span>
              <div className="service-copy">
                <h3>{service.title}</h3>
                <p>{service.description}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
