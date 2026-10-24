import { useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Play, X } from "@phosphor-icons/react";
import v1 from "@/assets/travel-1.mp4.asset.json";
import v2 from "@/assets/travel-2.mp4.asset.json";
import vK from "@/assets/insta-kyoto.mp4.asset.json";
import t1 from "@/assets/travel-1-thumb.jpg.asset.json";
import t2 from "@/assets/travel-2-thumb.jpg.asset.json";
import tK from "@/assets/insta-kyoto-thumb.jpg.asset.json";
import vB from "@/assets/br-hills.mp4.asset.json";
import tB from "@/assets/br-hills-thumb.jpg.asset.json";
import r1 from "@/assets/real-estate-1.mp4.asset.json";
import rt1 from "@/assets/real-estate-1-thumb.jpg.asset.json";
import r2 from "@/assets/final_3_1.mp4.asset.json";
import rt2 from "@/assets/final_3_1-thumb.jpg.asset.json";
import vx1 from "@/assets/vfx-1.mp4.asset.json";
import vxt1 from "@/assets/vfx-1-thumb.jpg.asset.json";
import e1 from "@/assets/event-recap-willsons.mp4.asset.json";
import et1 from "@/assets/event-recap-willsons-thumb.jpg.asset.json";

gsap.registerPlugin(ScrollTrigger);

type CategoryId = "travel" | "real-estate" | "vfx" | "event-recaps";

const categories: { id: CategoryId; label: string; tag: string }[] = [
  { id: "travel", label: "Travel", tag: "Travel / Vlog" },
  { id: "real-estate", label: "Real Estate", tag: "Real Estate" },
  { id: "vfx", label: "VFX", tag: "VFX" },
  { id: "event-recaps", label: "Event Recaps & Ads", tag: "Event Recap / Ad" },
];

type Project = {
  category: CategoryId;
  video: string;
  thumb: string;
  title: string;
  desc: string;
};

// Add new work here — just set the category and it appears under that tab.
const projects: Project[] = [
  {
    category: "travel",
    video: vK.url,
    thumb: tK.url,
    title: "Kyoto Cinematic",
    desc: "A cinematic Kyoto travel film — golden streets, temple light and smooth, breathing camera motion.",
  },
  {
    category: "travel",
    video: v1.url,
    thumb: t1.url,
    title: "Golden Hour Escape",
    desc: "A warm, sun-soaked travel cut paced to breathe — handheld frames, soft grade, ambient sound.",
  },
  {
    category: "travel",
    video: v2.url,
    thumb: t2.url,
    title: "Cinematic Roadtrip",
    desc: "Wide landscapes and motion-matched transitions edited into a short cinematic travel story.",
  },
  {
    category: "travel",
    video: vB.url,
    thumb: tB.url,
    title: "BR Hills Ride",
    desc: "A moto-vlog ride through the forest roads of BR Hills, Karnataka — winding climbs, misty valleys and a cinematic summit reveal.",
  },
  {
    category: "real-estate",
    video: r1.url,
    thumb: rt1.url,
    title: "Property Showcase",
    desc: "Cinematic real-estate walkthrough with smooth camera movement, warm tones and clean pacing.",
  },
  {
    category: "real-estate",
    video: r2.url,
    thumb: rt2.url,
    title: "Luxury Property Reel",
    desc: "Elegant vertical real-estate film highlighting space, light and atmosphere for premium listings.",
  },
  {
    category: "vfx",
    video: vx1.url,
    thumb: vxt1.url,
    title: "Holographic Showcase",
    desc: "A 3D VFX composite where a phone projects a spinning holographic carousel of films, with tracked light, depth and motion blur.",
  },
  {
    category: "event-recaps",
    video: e1.url,
    thumb: et1.url,
    title: "Willson's Live Music Lounge — Event Recap",
    desc: "A high-energy event recap for Willson's Restaurant & Live Music Lounge — live band performances, crowd moments and the full night atmosphere cut into a punchy promo film.",
  },
];

export default function Projects() {
  const root = useRef<HTMLElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);
  const [category, setCategory] = useState<CategoryId>("travel");
  const [active, setActive] = useState<number | null>(null);

  const visible = projects.filter((p) => p.category === category);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".proj-head",
        { opacity: 0, y: 40, filter: "blur(10px)" },
        {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 0.9,
          scrollTrigger: { trigger: root.current, start: "top 80%" },
        },
      );
      gsap.fromTo(
        ".proj-tabs",
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          scrollTrigger: { trigger: root.current, start: "top 78%" },
        },
      );
    }, root);
    return () => ctx.revert();
  }, []);

  // Animated tab indicator
  useLayoutEffect(() => {
    const move = () => {
      const el = tabsRef.current?.querySelector<HTMLElement>(`[data-cat="${category}"]`);
      const bar = indicatorRef.current;
      if (!el || !bar) return;
      gsap.to(bar, {
        x: el.offsetLeft,
        width: el.offsetWidth,
        duration: 0.5,
        ease: "power3.out",
      });
    };
    move();
    window.addEventListener("resize", move);
    return () => window.removeEventListener("resize", move);
  }, [category]);

  // Grid transition on category change
  useLayoutEffect(() => {
    if (!gridRef.current) return;
    const cards = gridRef.current.querySelectorAll(".proj-card");
    const tween = gsap.fromTo(
      cards,
      { opacity: 0, y: 40, scale: 0.97, filter: "blur(6px)" },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        filter: "blur(0px)",
        duration: 0.6,
        stagger: 0.08,
        ease: "power3.out",
      },
    );
    return () => {
      tween.kill();
    };
  }, [category]);

  useEffect(() => {
    if (active === null) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setActive(null);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [active]);

  const current = active !== null ? visible[active] : undefined;
  const activeTag = categories.find((c) => c.id === category)?.tag ?? "";

  return (
    <section ref={root} id="work" className="relative px-5 py-28 sm:px-10">
      <div className="mx-auto max-w-6xl">
        <div className="proj-head flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.35em] text-primary">Selected Work</p>
            <h2 className="mt-4 text-3xl font-light tracking-tight sm:text-5xl">
              Stories that <span className="text-gradient">move</span>
            </h2>
          </div>
          <p className="max-w-xs text-sm text-muted-foreground">
            Travel, real-estate, VFX and event films. Press play to watch the full cut.
          </p>
        </div>

        {/* Category navigation */}
        <div className="proj-tabs mt-10 overflow-x-auto">
          <div
            ref={tabsRef}
            role="tablist"
            aria-label="Work categories"
            className="relative inline-flex min-w-full gap-1 border-b border-border pb-0 sm:min-w-0 sm:gap-2"
          >
            {categories.map((c) => (
              <button
                key={c.id}
                data-cat={c.id}
                role="tab"
                aria-selected={category === c.id}
                type="button"
                onClick={() => {
                  setActive(null);
                  setCategory(c.id);
                }}
                className={`relative whitespace-nowrap px-4 py-3 text-[11px] uppercase tracking-[0.28em] transition-colors duration-300 sm:px-6 sm:text-xs ${
                  category === c.id
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {c.label}
              </button>
            ))}
            <span
              ref={indicatorRef}
              aria-hidden
              className="pointer-events-none absolute bottom-0 left-0 h-[2px] w-0 rounded-full bg-primary glow-ring"
            />
          </div>
        </div>

        <div ref={gridRef} className="mt-12 grid gap-8 sm:grid-cols-2">
          {visible.map((p, i) => (
            <article
              key={p.title}
              className="proj-card group glass overflow-hidden rounded-3xl transition-all duration-500 hover:-translate-y-2 hover:glow-ring"
            >
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Play ${p.title}`}
                className="relative block aspect-video w-full overflow-hidden"
              >
                <img
                  src={p.thumb}
                  alt={`${p.title} — ${activeTag} video thumbnail`}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <span className="absolute inset-0 bg-foreground/10 transition-colors duration-500 group-hover:bg-foreground/25" />
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="glass flex h-16 w-16 items-center justify-center rounded-full text-primary transition-all duration-500 group-hover:scale-110 group-hover:glow-ring">
                    <Play size={26} weight="fill" />
                  </span>
                </span>
              </button>

              <div className="p-6">
                <h3 className="text-lg font-medium">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.desc}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full border border-border px-3 py-1 text-[11px] uppercase tracking-wider text-muted-foreground">
                    {activeTag}
                  </span>
                </div>
              </div>
            </article>
          ))}

          {visible.length === 0 && (
            <div className="glass col-span-full rounded-3xl px-6 py-16 text-center">
              <p className="text-sm uppercase tracking-[0.28em] text-primary">Coming soon</p>
              <p className="mt-3 text-sm text-muted-foreground">
                New {activeTag.toLowerCase()} films are currently in post-production.
              </p>
            </div>
          )}
        </div>
      </div>

      {current && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={current.title}
          onClick={() => setActive(null)}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-foreground/70 p-4 backdrop-blur-md"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="glass relative w-full max-w-5xl overflow-hidden rounded-3xl"
          >
            <button
              type="button"
              onClick={() => setActive(null)}
              aria-label="Close video"
              className="glass absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors hover:text-primary"
            >
              <X size={18} weight="light" />
            </button>
            <video
              key={current.video}
              src={current.video}
              poster={current.thumb}
              className="aspect-video w-full bg-secondary object-contain"
              controls
              autoPlay
              playsInline
            />
          </div>
        </div>
      )}
    </section>
  );
}
