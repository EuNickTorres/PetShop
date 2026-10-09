"use client";

import Image from "next/image";
import type { StaticImageData } from "next/image";
import * as React from "react";
import { cn } from "@/lib/utils";

export interface WorksWheelItem {
  title: string;
  image: string | StaticImageData;
  alt: string;
  fit?: "cover" | "contain";
}

export interface WorksWheelProps extends Omit<React.ComponentPropsWithoutRef<"section">, "children"> {
  items: WorksWheelItem[];
  label?: string;
}

const CARD_RATIO = 1.34;
const STEP = 40;
const DRUM = 2.22;
const LENS = 2.7;
const RING_R = 1.14;
const BOW = 1.82;
const CULL = 1.6;
const WHEEL_UNITS = 520;
const DRAG_UNITS = 320;
const SETTLE = 150;
const EASE = 0.12;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));
const lerp = (from: number, to: number, progress: number) =>
  from + (to - from) * progress;
const radians = (degrees: number) => (degrees * Math.PI) / 180;

function place(
  ringDeg: number,
  drumDeg: number,
  ringRadius: number,
  drumRadius: number,
  bow: number,
  morph: number,
) {
  const bowX = -bow * (1 - Math.cos(radians(drumDeg)));
  return (
    `translateX(${morph * bowX}px)` +
    ` rotateZ(${(1 - morph) * ringDeg}deg) translateY(${-(1 - morph) * ringRadius}px)` +
    ` rotateX(${morph * drumDeg}deg) translateZ(${morph * drumRadius}px)`
  );
}

export function WorksWheel({
  items,
  label = "Momentos Dayana",
  className,
  ...props
}: WorksWheelProps) {
  const stageRef = React.useRef<HTMLDivElement>(null);
  const wheelRef = React.useRef<HTMLDivElement>(null);
  const cardRefs = React.useRef<(HTMLDivElement | null)[]>([]);
  const ringLabelRef = React.useRef<HTMLDivElement>(null);
  const frontTitleRef = React.useRef<HTMLDivElement>(null);
  const indexRef = React.useRef<HTMLOListElement>(null);
  const turn = React.useRef(0);
  const target = React.useRef(0);
  const settling = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const drag = React.useRef<{ x: number; y: number; pointerType: string } | null>(null);
  const [active, setActive] = React.useState(0);
  const [step, setStep] = React.useState(0);
  const [stage, setStage] = React.useState({ w: 0, h: 0 });
  const [reduced, setReduced] = React.useState(false);
  const [visible, setVisible] = React.useState(false);
  const count = items.length;
  const last = Math.max(count - 1, 0);

  React.useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  React.useEffect(() => {
    const element = stageRef.current;
    if (!element) return;
    const measure = () => setStage({ w: element.clientWidth, h: element.clientHeight });
    measure();
    const resize = new ResizeObserver(measure);
    resize.observe(element);
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    observer.observe(element);
    return () => {
      resize.disconnect();
      observer.disconnect();
    };
  }, [reduced]);

  const metrics = React.useMemo(() => {
    const isNarrow = stage.w < 640;
    const cardW = Math.min(stage.h * 0.44 * CARD_RATIO, stage.w * (isNarrow ? 0.48 : 0.36));
    const cardH = cardW / CARD_RATIO;
    const ringRadius = cardH * (isNarrow ? 0.98 : RING_R);
    const ringScale = count
      ? Math.min(clamp((((2 * Math.PI * ringRadius) / count) * 0.82) / (cardW || 1), 0.16, 1), isNarrow ? 0.65 : 1)
      : 1;
    return {
      cardW,
      cardH,
      ringRadius,
      ringScale,
      frontScale: isNarrow ? 1.3 : 1,
      drumRadius: cardH * DRUM,
      bow: cardH * BOW,
      depth: cardH * LENS,
    };
  }, [stage, count]);

  React.useEffect(() => {
    if (!stage.h || !visible || reduced || !count) return;
    let frame = 0;
    const draw = () => {
      const difference = target.current - turn.current;
      turn.current = Math.abs(difference) < 0.0005
        ? target.current
        : turn.current + difference * EASE;
      const progress = turn.current;
      const morph = clamp(progress, 0, 1);
      const position = Math.max(0, progress - 1);

      if (wheelRef.current) {
        wheelRef.current.style.transform = `translateZ(${-morph * metrics.drumRadius}px)`;
      }
      for (let index = 0; index < count; index++) {
        const card = cardRefs.current[index];
        if (!card) continue;
        const distance = index - position;
        const drumDeg = distance * STEP;
        card.style.transform = place(
          distance * (360 / count),
          drumDeg,
          metrics.ringRadius,
          metrics.drumRadius,
          metrics.bow,
          morph,
        );
        card.style.opacity = morph > 0.5 && Math.abs(distance) > CULL ? "0" : "1";
        card.style.zIndex = String(Math.round(100 - Math.abs(distance) * 2));
        const face = card.firstElementChild as HTMLElement | null;
        if (face) face.style.transform = `scale(${lerp(metrics.ringScale, metrics.frontScale, morph)})`;
      }
      if (ringLabelRef.current) ringLabelRef.current.style.opacity = String(1 - morph);
      if (frontTitleRef.current) frontTitleRef.current.style.opacity = String(morph);
      if (indexRef.current) {
        indexRef.current.style.opacity = String(clamp((morph - 0.55) * 2.25, 0, 1));
        indexRef.current.style.pointerEvents = morph > 0.9 ? "auto" : "none";
      }
      const nearest = clamp(Math.round(position), 0, last);
      setActive((previous) => previous === nearest ? previous : nearest);
      const currentStep = clamp(Math.round(progress), 0, last + 1);
      setStep((previous) => previous === currentStep ? previous : currentStep);
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [metrics, stage.h, visible, reduced, count, last]);

  const to = React.useCallback((next: number) => {
    target.current = clamp(next, 0, last + 1);
    if (reduced) setActive(clamp(Math.round(target.current - 1), 0, last));
  }, [last, reduced]);

  React.useEffect(() => {
    const element = stageRef.current;
    if (!element || reduced || !count) return;
    const onWheel = (event: WheelEvent) => {
      const next = target.current + event.deltaY / WHEEL_UNITS;
      const canTurn = event.deltaY > 0
        ? target.current < last + 1
        : target.current > 0;
      if (!canTurn) return;
      event.preventDefault();
      to(next);
      if (settling.current) clearTimeout(settling.current);
      settling.current = setTimeout(() => to(Math.round(target.current)), SETTLE);
    };
    element.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      element.removeEventListener("wheel", onWheel);
      if (settling.current) clearTimeout(settling.current);
    };
  }, [to, last, reduced, count]);

  if (!count) return null;

  return (
    <section className={cn("works-wheel", className)} aria-label={label} {...props}>
      {reduced ? (
        <div className="works-wheel-static">
          {items.map((item) => (
            <figure key={item.title}>
              <div className="works-wheel-static-image">
                <Image
                  src={item.image}
                  alt={item.alt}
                  fill
                  sizes="(max-width: 640px) 80vw, 30vw"
                  style={{ objectFit: item.fit ?? "cover" }}
                />
              </div>
              <figcaption>{item.title}</figcaption>
            </figure>
          ))}
        </div>
      ) : (
        <>
          <div
            ref={stageRef}
            className="works-wheel-stage"
            role="group"
            tabIndex={0}
            aria-label="Galería interactiva. Usa las flechas del teclado o los controles para explorar."
            style={{ perspective: `${metrics.depth}px` }}
            onPointerDown={(event) => {
              if ((event.target as HTMLElement).closest("button")) return;
              drag.current = { x: event.clientX, y: event.clientY, pointerType: event.pointerType };
              if (event.pointerType === "mouse") event.currentTarget.setPointerCapture(event.pointerId);
            }}
            onPointerMove={(event) => {
              if (!drag.current) return;
              const delta = drag.current.pointerType === "touch"
                ? drag.current.x - event.clientX
                : drag.current.y - event.clientY;
              to(target.current + delta / DRAG_UNITS);
              drag.current = { x: event.clientX, y: event.clientY, pointerType: event.pointerType };
            }}
            onPointerUp={() => {
              drag.current = null;
              to(Math.round(target.current));
            }}
            onPointerCancel={() => { drag.current = null; }}
            onKeyDown={(event) => {
              if (event.key === "ArrowRight" || event.key === "ArrowDown") to(Math.round(target.current) + 1);
              else if (event.key === "ArrowLeft" || event.key === "ArrowUp") to(Math.round(target.current) - 1);
              else return;
              event.preventDefault();
            }}
          >
            <div ref={wheelRef} className="works-wheel-drum">
              {stage.h > 0 && items.map((item, index) => (
                <div
                  key={`${item.title}-${index}`}
                  aria-hidden={step > 0 && index !== active}
                  ref={(node) => { cardRefs.current[index] = node; }}
                  className="works-wheel-card"
                  style={{
                    width: metrics.cardW,
                    height: metrics.cardH,
                    marginLeft: -metrics.cardW / 2,
                    marginTop: -metrics.cardH / 2,
                  }}
                >
                  <div className="works-wheel-card-face">
                    <Image
                      src={item.image}
                      alt={item.alt}
                      fill
                      sizes="(max-width: 640px) 65vw, 40vw"
                      style={{ objectFit: item.fit ?? "cover" }}
                    />
                    <span aria-hidden="true" className="works-wheel-card-number">{String(index + 1).padStart(2, "0")}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div ref={ringLabelRef} className="works-wheel-ring-label" aria-hidden="true">
            <span>Un poquito de</span>
            <strong>nuestro mundo</strong>
          </div>
          <div ref={frontTitleRef} className="works-wheel-front-title" aria-hidden="true">
            <span>{String(active + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}</span>
            <strong>{items[active]?.title}</strong>
          </div>
          <div className="works-wheel-controls">
            <span className="works-wheel-controls-label">Explora la galería</span>
            <div className="works-wheel-controls-actions">
              <button type="button" aria-label="Foto anterior" disabled={step === 0} onClick={() => to(Math.max(0, Math.round(target.current) - 1))}>←</button>
              <button type="button" aria-label="Foto siguiente" disabled={step === last + 1} onClick={() => to(Math.min(last + 1, Math.round(target.current) + 1))}>→</button>
            </div>
          </div>
          <ol ref={indexRef} className="works-wheel-index" aria-label="Fotos de la galería" inert={step === 0}>
            {items.map((item, index) => (
              <li key={`${item.title}-index`}>
                <button type="button" aria-current={index === active ? "true" : undefined} onClick={() => to(index + 1)}>
                  <span>{String(index + 1).padStart(2, "0")}</span>{item.title}
                </button>
              </li>
            ))}
          </ol>
        </>
      )}
    </section>
  );
}

export default WorksWheel;
