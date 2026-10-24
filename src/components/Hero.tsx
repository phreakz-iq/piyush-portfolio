import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowDown, PlayCircle } from "@phosphor-icons/react";
import showreel from "@/assets/travel_cinematic.mp4.asset.json";

gsap.registerPlugin(ScrollTrigger);

export default function Hero() {
  const root = useRef<HTMLElement>(null);
  const video = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = video.current;
    if (!el) return;
    const tryPlay = () => void el.play().catch(() => undefined);
    tryPlay();
    el.addEventListener("canplay", tryPlay);
    document.addEventListener("click", tryPlay, { once: true });
    return () => el.removeEventListener("canplay", tryPlay);
  }, []);



  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ delay: 0.15 });

      tl.fromTo(
        ".hero-reel",
        { opacity: 0, scale: 1.08, filter: "blur(18px)" },
        { opacity: 1, scale: 1, filter: "blur(0px)", duration: 1.6, ease: "power3.out" },
      )
        .fromTo(
          ".hero-line",
          { opacity: 0, y: 60, filter: "blur(14px)" },
          { opacity: 1, y: 0, filter: "blur(0px)", duration: 1.1, stagger: 0.13, ease: "power3.out" },
          "-=1.3",
        )
        .fromTo(
          ".hero-sub",
          { opacity: 0, y: 24, filter: "blur(8px)" },
          { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.9 },
          "-=0.7",
        )
        .fromTo(
          ".hero-cta",
          { opacity: 0, scale: 0.86 },
          { opacity: 1, scale: 1, duration: 1, stagger: 0.1, ease: "elastic.out(1, 0.55)" },
          "-=0.5",
        );

      // Ambient glow orbs float
      gsap.to(".glow-orb", {
        y: -28,
        duration: 3.4,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        stagger: 0.7,
      });

      // Scroll depth: reel settles
      gsap.to(".hero-reel", {
        scale: 1.06,
        ease: "none",
        scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: 0.8 },
      });
    }, root);

    // Mouse parallax (3D depth)
    const onMove = (e: MouseEvent) => {
      const nx = e.clientX / window.innerWidth - 0.5;
      const ny = e.clientY / window.innerHeight - 0.5;
      gsap.to(".hero-copy", { x: nx * -12, y: ny * -8, duration: 1.4, ease: "power3.out" });
      gsap.to(".glow-orb", {
        x: nx * 30,
        y: ny * 20,
        duration: 1.2,
        ease: "power3.out",
        stagger: 0.15,
      });
    };
    window.addEventListener("mousemove", onMove);

    return () => {
      window.removeEventListener("mousemove", onMove);
      ctx.revert();
    };
  }, []);

  return (
    <section
      ref={root}
      id="home"
      className="relative flex min-h-screen items-center overflow-hidden grain px-5 pt-28 sm:px-10"
    >
      {/* Layer 1 — fullscreen cinematic showreel */}
      <div className="hero-reel absolute inset-0 -z-20">
        <video
          ref={video}
          className="h-full w-full object-cover"
          src={showreel.url}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-label="Cinematic showreel background"
        />
        <div className="absolute inset-0 bg-background/45" />
        <div className="absolute inset-0 warm-aura" />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-b from-transparent to-background" />
      </div>

      {/* Ambient glow orbs */}
      <div className="glow-orb pointer-events-none absolute left-[10%] top-[24%] -z-10 h-52 w-52 rounded-full bg-primary/18 blur-3xl" />
      <div className="glow-orb pointer-events-none absolute right-[14%] top-[16%] -z-10 h-40 w-40 rounded-full bg-gold/25 blur-3xl" />
      <div className="glow-orb pointer-events-none absolute bottom-[16%] left-[42%] -z-10 h-56 w-56 rounded-full bg-amber/15 blur-3xl" />

      {/* Layer 3 — UI content */}
      <div className="hero-copy relative mx-auto w-full max-w-5xl pb-24 text-center">
        <span className="hero-line glass inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[11px] uppercase tracking-[0.32em] text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          Available for select projects
        </span>

        <h1 className="mt-8 text-[2.6rem] font-light leading-[1.02] tracking-tight sm:text-7xl lg:text-8xl">
          <span className="hero-line block">Hi, I&apos;m Piyush</span>
          <span className="hero-line block font-normal text-gradient">Video Editor</span>
        </h1>

        <p className="hero-sub mx-auto mt-7 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          A creative director crafting cinematic stories — motion graphics, precise color grading
          and sound design that make brands impossible to scroll past.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <a
            href="#contact"
            className="hero-cta group inline-flex items-center gap-2 rounded-full bg-primary px-8 py-4 text-sm font-medium text-primary-foreground transition-all duration-500 hover:scale-105 hover:glow-ring"
          >
            Hire Me
          </a>
          <a
            href="#work"
            className="hero-cta glass group inline-flex items-center gap-2 rounded-full px-7 py-4 text-sm font-medium text-foreground transition-all duration-500 hover:scale-105 hover:text-primary hover:glow-ring"
          >
            <PlayCircle size={18} weight="light" /> Portfolio Videos
          </a>
        </div>

        <div className="mt-16 flex justify-center text-muted-foreground">
          <ArrowDown size={20} weight="light" className="animate-bounce" />
        </div>
      </div>
    </section>
  );
}
