import Image from "next/image";
import storefrontImage from "../../Foto frente loja.jpeg";

export default function About() {
  return (
    <section id="sobre-nosotros">
      <div className="mx-auto grid max-w-6xl gap-12 px-5 py-24 sm:px-6 md:grid-cols-[1.06fr_0.94fr] md:items-center md:py-36">
        <div data-reveal className="relative order-2 md:order-1">
          <div className="about-image-frame">
            <Image
              src={storefrontImage}
              alt="Fachada de la peluquería en Tarragona"
              fill
              sizes="(max-width: 767px) 100vw, 52vw"
              className="object-cover object-center"
            />
          </div>
          <div className="about-note">
            <p className="text-[0.6rem] font-bold uppercase tracking-[0.18em] text-brand-dark/55">Nuestro enfoque</p>
            <p className="mt-1 text-sm font-bold text-brand-dark">Cuidado con calma</p>
          </div>
        </div>
        <div data-reveal data-reveal-delay="1" className="order-1 md:order-2">
          <h2 className="mt-4 max-w-xl text-4xl font-bold leading-[1.02] tracking-[-0.045em] text-foreground [text-wrap:balance] sm:text-5xl">
            Una visita pensada para que se sientan tranquilos.
          </h2>
          <p className="mt-6 max-w-lg text-base leading-7 text-foreground/80">
            En Dayana Peluquería cada mascota recibe una atención cercana, con paciencia y mucho cariño. Queremos que salga limpia, cómoda y feliz.
          </p>
          <p className="mt-4 max-w-lg text-sm leading-6 text-foreground/75">Un trato cercano, tiempos tranquilos y una atención adaptada a cada peludo.</p>
        </div>
      </div>
    </section>
  );
}
