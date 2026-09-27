import Image from "next/image";
import { siteConfig } from "@/lib/site-config";

export default function Gallery() {
  return (
    <section id="galeria" className="mx-auto max-w-6xl px-5 py-24 sm:px-6 md:py-36">
      <div className="gallery-shell">
        <div data-reveal className="gallery-heading">
          <div>
            <h2 className="mt-4 max-w-2xl text-4xl font-bold leading-[1.02] tracking-[-0.045em] [text-wrap:balance] sm:text-5xl">
              Peludos felices, cuidados de verdad.
            </h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-foreground/72">
              Un vistazo a los cuidados, los cortes y los mejores momentos del salón.
            </p>
          </div>
          <a
            href={siteConfig.social.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-fit items-center gap-2 rounded-full bg-brand-dark px-5 py-3 text-sm font-bold text-brand-light transition hover:-translate-y-0.5 hover:bg-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Ver Instagram <span aria-hidden>↗</span>
          </a>
        </div>
        <div data-reveal data-reveal-delay="1" className="gallery-grid">
          <div className="gallery-image gallery-image-tall"><Image src="/images/pets-collage.jpg" alt="Mascotas atendidas en Dayana Peluquería" fill sizes="(max-width: 640px) 100vw, 35vw" /></div>
          <div className="gallery-image gallery-image-offset"><Image src="/images/hero-dog.png" alt="Perro recién cuidado" fill sizes="(max-width: 640px) 100vw, 35vw" /></div>
          <div className="gallery-image"><Image src="/images/dayana-com-pet.png" alt="Dayana junto a una mascota" fill sizes="(max-width: 640px) 100vw, 35vw" /></div>
        </div>
      </div>
    </section>
  );
}
