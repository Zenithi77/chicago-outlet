"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { classNames } from "@/lib/utils";

type Scene = {
  /** Direct mp4 source. Replace with your own brand footage in /public if desired. */
  src: string;
  kicker: string;
  title: string;
  /** gradient fallback shown while the clip loads (or if it cannot play) */
  from: string;
  to: string;
};

// Free-to-use fashion clips (Mixkit Free License). Swap for your own brand
// footage by dropping files in /public and pointing src to e.g. "/hero-1.mp4".
const SCENES: Scene[] = [
  {
    src: "https://assets.mixkit.co/videos/49381/49381-720.mp4",
    kicker: "Heritage Series · FW25",
    title: "Dressed for the City.",
    from: "#1A1A1A",
    to: "#3A3A3A",
  },
  {
    src: "https://assets.mixkit.co/videos/805/805-720.mp4",
    kicker: "Urban Essentials",
    title: "Built for Life.",
    from: "#2C3E5B",
    to: "#5A7295",
  },
  {
    src: "https://assets.mixkit.co/videos/9060/9060-720.mp4",
    kicker: "New Arrivals · SS25",
    title: "Elevated Basics.",
    from: "#8A6F3E",
    to: "#C8A96E",
  },
];

export function HeroVideo() {
  const [active, setActive] = useState(0);
  const [isDesktop, setIsDesktop] = useState(false);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  // Track viewport so we can avoid the zoom/crop on small screens.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 640px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Try to autoplay the active clip; advance on end.
  useEffect(() => {
    const v = videoRefs.current[active];
    if (v) {
      v.currentTime = 0;
      v.play().catch(() => {});
    }
  }, [active]);

  const handleEnded = () => setActive((a) => (a + 1) % SCENES.length);

  const scene = SCENES[active];

  return (
    <section className="relative aspect-video w-full overflow-hidden bg-foreground sm:aspect-auto sm:h-[82vh]">
      {/* Video reel */}
      {SCENES.map((s, i) => (
        <div
          key={i}
          className={classNames(
            "absolute inset-0 transition-opacity duration-1000 ease-in-out",
            i === active ? "opacity-100" : "opacity-0"
          )}
          aria-hidden={i !== active}
        >
          {/* gradient fallback behind each video */}
          <div
            className="absolute inset-0"
            style={{ background: `linear-gradient(135deg, ${s.from}, ${s.to})` }}
          />
          <video
            ref={(el) => {
              videoRefs.current[i] = el;
            }}
            className="absolute inset-0 h-full w-full object-cover object-center brightness-100"
            style={{
              animation:
                isDesktop && i === active ? "kenBurns 9s ease-out both" : "none",
            }}
            src={s.src}
            muted
            playsInline
            preload="auto"
            autoPlay={i === 0}
            onEnded={i === active ? handleEnded : undefined}
          />
        </div>
      ))}

      {/* Cinematic readability gradients + vignette (lighter on mobile so the video stays clear) */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/45 via-black/15 to-transparent sm:from-black/80 sm:via-black/45 sm:to-black/10" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/15 sm:from-black/70 sm:via-transparent sm:to-black/30" />

      {/* Film grain */}
      <div
        className="pointer-events-none absolute -inset-1/4 opacity-[0.06] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          animation: "grain 1.2s steps(4) infinite",
        }}
      />

      {/* Cinematic letterbox bars (hidden on mobile so the full frame fits) */}
      <div className="pointer-events-none absolute inset-x-0 top-0 hidden bg-black/85 sm:block sm:h-9 md:h-11" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 hidden bg-black/85 sm:block sm:h-9 md:h-11" />

      {/* Content */}
      <div className="container-page relative flex h-full flex-col justify-end pb-16 text-white sm:justify-center sm:pb-0">
        <div key={active} className="max-w-2xl">
          <p
            className="mb-1.5 text-[9px] font-semibold uppercase tracking-[0.25em] text-accent/70 sm:mb-4 sm:text-xs sm:tracking-[0.36em] sm:text-accent"
            style={{ animation: "heroReveal 0.8s ease both" }}
          >
            {scene.kicker}
          </p>
          <h1
            className="font-serif text-xl font-bold leading-[1.1] text-white/70 sm:text-5xl sm:text-white md:text-7xl"
            style={{ animation: "heroReveal 0.9s ease 0.1s both" }}
          >
            {scene.title}
          </h1>
          <p
            className="mt-2 hidden max-w-md text-sm text-white/80 sm:mt-6 sm:block md:text-base"
            style={{ animation: "heroReveal 1s ease 0.2s both" }}
          >
            Орчин үеийн Америк сонгодог хэв маяг. Чанартай суурь хувцас, цаг
            хугацааг даван туулах загвар.
          </p>

          <div className="mt-3 hidden flex-row flex-wrap gap-2 sm:mt-8 sm:flex sm:gap-3">
            <Link
              href="/shop"
              className="rounded-md bg-accent px-4 py-2 text-center text-xs font-semibold text-foreground transition hover:bg-white sm:px-7 sm:py-3 sm:text-sm"
            >
              Цуглуулга үзэх
            </Link>
            <Link
              href="/shop?gender=women"
              className="rounded-md border border-white/40 px-4 py-2 text-center text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-white/10 sm:px-7 sm:py-3 sm:text-sm"
            >
              Эмэгтэй
            </Link>
          </div>
        </div>

        {/* Scene timeline indicators */}
        <div className="absolute bottom-4 left-0 right-0 sm:bottom-16">
          <div className="container-page flex items-center gap-2">
            {SCENES.map((_, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className="relative h-1 flex-1 overflow-hidden rounded-full bg-white/25"
                aria-label={`Дүр ${i + 1}`}
              >
                <span
                  className={classNames(
                    "absolute inset-0 origin-left rounded-full bg-accent transition-transform",
                    i === active ? "scale-x-100" : i < active ? "scale-x-100" : "scale-x-0"
                  )}
                />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll hint */}
      <div className="pointer-events-none absolute bottom-1.5 left-1/2 z-10 hidden -translate-x-1/2 text-[10px] uppercase tracking-[0.3em] text-white/50 sm:bottom-3 sm:block">
        Scroll
      </div>
    </section>
  );
}
