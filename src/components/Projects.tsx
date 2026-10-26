import { useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Play, X } from "@phosphor-icons/react";
import { useSiteContent } from "@/lib/site-content";

gsap.registerPlugin(ScrollTrigger);

export default function Projects() {
  const root = useRef<HTMLElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);
  const { categories, projects: rows } = useSiteContent();
  const [category, setCategory] = useState<string>(categories[0]?.id ?? "");
  const [active, setActive] = useState<number | null>(null);

  const projects = rows.map((r) => ({
    category: r.category_id,
    video: r.video_url,
    thumb: r.thumb_url,
    title: r.title,
    desc: r.description,
  }));
  const visible = projects.filter((p) => p.category === category);

  // If the open category was renamed/removed in the admin, fall back to the first one.
  useEffect(() => {
    if (categories.length && !categories.some((c) => c.id === category)) {
      setCategory(categories[0]?.id ?? "");
    }
  }, [categories, category]);

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
                <span className="absolute inset-0 bg-foreground/10 transition-colors duration-500 group-hover:bg-foreground/25 dark:bg-black/10 dark:group-hover:bg-black/25" />
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
          className="fixed inset-0 z-[80] flex items-center justify-center bg-foreground/70 p-4 backdrop-blur-md dark:bg-black/75"
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
