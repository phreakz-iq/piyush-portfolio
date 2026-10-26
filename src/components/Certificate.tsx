import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Award, BadgeCheck } from "lucide-react";
import certAsset from "@/assets/video-editing-certificate.png.asset.json";

gsap.registerPlugin(ScrollTrigger);

export default function Certificate() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".cert-reveal",
        { y: 60, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1,
          ease: "power3.out",
          stagger: 0.15,
          scrollTrigger: { trigger: sectionRef.current, start: "top 75%" },
        }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="certificate"
      className="relative overflow-hidden bg-[#faf7f2] py-24 dark:bg-[#1a1816] sm:py-32"
    >
      <div className="pointer-events-none absolute -top-32 right-0 h-96 w-96 rounded-full bg-orange-200/30 blur-[120px] dark:bg-orange-500/15" />
      <div className="mx-auto max-w-5xl px-6">
        <div className="cert-reveal mb-14 text-center">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.25em] text-orange-600 dark:border-orange-500/30 dark:bg-orange-500/10 dark:text-orange-400">
            <Award className="h-3.5 w-3.5" /> Certification
          </span>
          <h2 className="font-display text-4xl font-bold text-neutral-900 dark:text-neutral-50 sm:text-5xl">
            Certified in <span className="text-orange-500">Video Editing</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-neutral-500 dark:text-neutral-400">
            Officially certified by Editing Skool after completing the Video Editing Masterclass.
          </p>
        </div>

        <div className="cert-reveal group relative">
          <div className="absolute -inset-3 rounded-[2rem] bg-gradient-to-br from-orange-200/60 via-transparent to-orange-100/40 blur-xl dark:from-orange-500/20 dark:to-orange-400/10 transition-opacity duration-500 group-hover:opacity-100" />
          <figure className="relative overflow-hidden rounded-3xl border border-neutral-200 bg-white dark:border-white/10 shadow-2xl shadow-orange-500/10 transition-transform duration-500 group-hover:-translate-y-1">
            <img
              src={certAsset.url}
              alt="Video Editing Masterclass certificate awarded to Piyush Uikey by Editing Skool"
              loading="lazy"
              className="w-full object-cover"
            />
          </figure>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm text-neutral-500 dark:text-neutral-400">
            <span className="inline-flex items-center gap-1.5 font-medium text-neutral-700 dark:text-neutral-200">
              <BadgeCheck className="h-4 w-4 text-orange-500" /> Editing Skool — Video Editing Masterclass
            </span>
            <span>Issued August 2026</span>
          </div>
        </div>
      </div>
    </section>
  );
}
