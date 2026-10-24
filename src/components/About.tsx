import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  FilmSlate,
  Waveform,
  PaintBrushBroad,
  Sparkle,
  BookOpenText,
} from "@phosphor-icons/react";
import profile from "@/assets/profile-2.jpeg.asset.json";

gsap.registerPlugin(ScrollTrigger);

const skills = [
  { icon: FilmSlate, label: "Video Editing" },
  { icon: Sparkle, label: "Motion Graphics" },
  { icon: Waveform, label: "Sound Design" },
  { icon: PaintBrushBroad, label: "Color Grading" },
  { icon: BookOpenText, label: "Visual Storytelling" },
];

export default function About() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".about-img",
        { opacity: 0, x: -80, filter: "blur(14px)" },
        {
          opacity: 1,
          x: 0,
          filter: "blur(0px)",
          duration: 1.1,
          ease: "power3.out",
          scrollTrigger: { trigger: root.current, start: "top 75%" },
        },
      );
      gsap.fromTo(
        ".about-copy",
        { opacity: 0, y: 40, filter: "blur(10px)" },
        {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 1,
          ease: "power3.out",
          scrollTrigger: { trigger: root.current, start: "top 75%" },
        },
      );
      gsap.fromTo(
        ".skill-chip",
        { opacity: 0, y: 24, scale: 0.94 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.6,
          stagger: 0.09,
          ease: "back.out(1.6)",
          scrollTrigger: { trigger: ".skill-grid", start: "top 85%" },
        },
      );
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} id="about" className="relative px-5 py-28 sm:px-10">
      <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[0.8fr_1fr]">
        <div className="about-img flex justify-center">
          <div className="group relative">
            <div className="absolute -inset-4 rounded-[2rem] bg-primary/25 blur-3xl transition-all duration-500 group-hover:bg-accent/30" />
            <div className="relative h-72 w-72 overflow-hidden rounded-[2rem] border border-border glow-ring sm:h-80 sm:w-80">
              <img
                src={profile.url}
                alt="Portrait of Piyush, video editor"
                className="h-full w-full object-cover object-top scale-[1.02] transition-transform duration-500 group-hover:-translate-y-2 group-hover:scale-105"
              />
            </div>
          </div>
        </div>

        <div className="about-copy">
          <p className="text-[11px] uppercase tracking-[0.35em] text-primary">About</p>
          <h2 className="mt-4 text-3xl font-light tracking-tight sm:text-5xl">
            Editing that feels <span className="text-gradient">cinematic</span>
          </h2>
          <p className="mt-5 max-w-xl leading-relaxed text-muted-foreground">
            I&apos;m a video editor and filmmaker  with 1+ years shaping brand films, product launches
            and social campaigns. From first cut to final grade, I build rhythm, mood and momentum
            into every frame.
          </p>

          <div className="skill-grid mt-9 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {skills.map((s) => (
              <div
                key={s.label}
                className="skill-chip glass flex items-center gap-3 rounded-2xl px-4 py-3.5 transition-all duration-300 hover:-translate-y-1 hover:glow-ring"
              >
                <s.icon size={22} weight="light" className="text-primary" />
                <span className="text-sm text-foreground">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
