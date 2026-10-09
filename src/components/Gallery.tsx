import { siteConfig } from "@/lib/site-config";
import { WorksWheel, type WorksWheelItem } from "@/components/ui/works-wheel";
import galleryPhoto1 from "../../Fotos Galeria/Photo1.jpeg";
import galleryPhoto2 from "../../Fotos Galeria/Photo2.jpeg";
import galleryPhoto3 from "../../Fotos Galeria/Photo3.jpeg";
import galleryPhoto4 from "../../Fotos Galeria/Photo4.jpeg";

const galleryItems: WorksWheelItem[] = [
  { title: "Nuestro salón", image: "/images/fachada.jpg", alt: "Entrada de Dayana Peluquería en Tarragona" },
  { title: "Peludos felices", image: galleryPhoto1, alt: "Tres perros pequeños después de su sesión de peluquería" },
  { title: "En buenas manos", image: galleryPhoto2, alt: "Dayana sonriendo mientras sostiene a dos perros recién arreglados", fit: "contain" },
  { title: "Antes y después", image: galleryPhoto3, alt: "Antes y después del corte de un perro shih tzu", fit: "contain" },
  { title: "Cuidado a medida", image: galleryPhoto4, alt: "Antes y después del arreglo de un perro pomerania", fit: "contain" },
];

export default function Gallery() {
  return (
    <section id="galeria" className="mx-auto max-w-6xl px-5 py-24 sm:px-6 md:py-36">
      <div className="gallery-shell">
        <div data-reveal className="gallery-heading">
          <div>
            <span className="section-kicker">Un vistazo al salón</span>
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
        <WorksWheel items={galleryItems} label="Momentos de Dayana Peluquería" />
        <p className="gallery-interaction-note">Gira la rueda, arrastra o usa los botones para descubrir más.</p>
      </div>
    </section>
  );
}
