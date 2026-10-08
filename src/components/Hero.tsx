"use client";

import { CaretDoubleDownIcon } from "@phosphor-icons/react/dist/ssr/CaretDoubleDown";
import Image from "next/image";
import { motion, useScroll, useSpring, useTransform } from "motion/react";
import { useRef, type CSSProperties } from "react";
import WhatsAppButton from "./WhatsAppButton";
import Header from "./Header";

const titleLetters = Array.from("BIENVENIDOS");

export default function Hero() {
  const sceneRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: sceneRef, offset: ["start start", "end end"] });
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 90, damping: 26, mass: 0.6 });
  const dogY = useTransform(smoothProgress, [0, 0.55], ["14vh", "0vh"]);
  const dogScale = useTransform(smoothProgress, [0, 0.55], [1.22, 1]);
  const dogRotate = useTransform(smoothProgress, [0, 0.55], [-2, 0]);

  return (
    <section id="inicio" ref={sceneRef} className="hero-scroll-scene">
      <div className="editorial-hero">
      <Header />
      <div className="hero-art">
      <div className="editorial-dog-stage">
        <motion.div className="editorial-dog-motion" style={{ y: dogY, scale: dogScale, rotate: dogRotate }}>
          <motion.div
            className="editorial-dog-motion-inner"
            initial={{ opacity: 0, y: 42, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1.05, ease: [0.16, 1, 0.3, 1] }}
          >
            <Image src="/images/hero-dog-editorial.png" alt="Perro cuidado y listo para su sesión de peluquería" fill priority sizes="(max-width: 767px) 90vw, 48vw" className="editorial-dog-image" />
          </motion.div>
        </motion.div>
      </div>

      <div className="hero-intro-cards absolute right-8 top-[20%] z-10 hidden gap-3 xl:flex lg:right-12">
        <article className="editorial-service-card">
          <div className="relative h-[10.5rem]"><Image src="/images/hero-dog.png" alt="Perro después de su corte" fill sizes="152px" /></div>
          <p>Corte a medida</p>
        </article>
        <article className="editorial-service-card">
          <div className="relative h-[10.5rem]"><Image src="/images/pets-collage.jpg" alt="Mascotas atendidas con cuidado" fill sizes="152px" /></div>
          <p>Higiene y bienestar</p>
        </article>
      </div>
      </div>

      <div className="hero-content">
        <h1 className="editorial-display editorial-display--welcome" aria-label="Bienvenidos">
          {titleLetters.map((letter, index) => (
            <span
              key={`${letter}-${index}`}
              aria-hidden="true"
              style={{ "--letter-index": index } as CSSProperties}
            >
              {letter}
            </span>
          ))}
        </h1>
        <p className="hero-intro-tagline text-[0.6rem] font-bold uppercase tracking-[0.24em] text-brand-dark sm:text-xs">
          <span className="editorial-rule mr-4" /> Belleza y bienestar para una mejor vida <span className="editorial-rule ml-4" />
        </p>
        <p className="hero-intro-copy mx-auto max-w-md text-sm leading-6 text-brand-dark sm:text-base">
          Peluquería canina y felina con el cuidado que tu mascota merece.
        </p>
        <div className="hero-intro-cta">
          <WhatsAppButton label="Reservar por WhatsApp" />
        </div>
      </div>
      <div className="hero-scroll-cue" aria-hidden="true">
        <span>Desliza hacia abajo</span>
        <CaretDoubleDownIcon weight="bold" />
      </div>
      </div>
    </section>
  );
}
