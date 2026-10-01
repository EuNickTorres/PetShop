import { siteConfig } from "@/lib/site-config";

export default function Reviews() {
  return (
    <section id="opiniones" className="reviews-section">
      <div className="reviews-layout mx-auto max-w-6xl px-5 sm:px-6">
        <div className="reviews-editorial">
          <div data-reveal className="reviews-intro">
            <p className="reviews-source">Reseñas en Google Maps</p>
            <h2 className="mt-4 max-w-3xl text-4xl font-bold leading-[1.02] tracking-[-0.045em] [text-wrap:balance] sm:text-5xl">
              La confianza se gana mascota a mascota.
            </h2>
            <p className="mt-6 max-w-xl text-base leading-7 text-foreground/75">
              Opiniones públicas de personas que ya confiaron en Dayana para cuidar a sus compañeros.
            </p>
          </div>

          <div data-reveal data-reveal-delay="1" className="reviews-rating">
            <strong>{siteConfig.googleReviews.rating}</strong>
            <div>
              <div className="reviews-stars" role="img" aria-label="Cinco de cinco estrellas">
                <span aria-hidden="true">★★★★★</span>
              </div>
              <p>{siteConfig.googleReviews.countLabel}</p>
              <small>Valoración pública en Google Maps</small>
            </div>
          </div>
        </div>

        <div data-reveal data-reveal-delay="1" className="reviews-action">
          <p>Lee todas las experiencias en la ficha oficial del establecimiento.</p>
          <div>
            <a
              href={siteConfig.googleReviews.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="reviews-link"
            >
              Ver reseñas en Google <span aria-hidden="true">↗</span>
            </a>
            <small>La información más reciente siempre está disponible en Google Maps.</small>
          </div>
        </div>
      </div>
    </section>
  );
}
