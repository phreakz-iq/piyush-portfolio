import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Star } from "@phosphor-icons/react";

gsap.registerPlugin(ScrollTrigger);

const reviews = [
  {
    user: "david822557",
    country: "United Kingdom",
    flag: "🇬🇧",
    text: "Great seller and great gig",
    value: "Up to $50",
    duration: "2 days",
  },
  {
    user: "adrien_wadowski",
    country: "Belgium",
    flag: "🇧🇪",
    text: "It was a real pleasure to collaborate together on our project. Congratulations to him for his professionalism and proactivity",
    value: "$50-$100",
    duration: "4 days",
  },
  {
    user: "djhkm123",
    country: "Malaysia",
    flag: "🇲🇾",
    text: "Would love to work with you again, will improve on my camera works",
    value: "Up to $50",
    duration: "6 days",
  },
];

function Card({ r }: { r: (typeof reviews)[number] }) {
  return (
    <article className="glass w-[19rem] shrink-0 rounded-3xl p-6 transition-all duration-500 hover:-translate-y-2 hover:scale-[1.02] hover:glow-ring sm:w-[23rem]">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1 text-primary" aria-label="5 out of 5 stars">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} size={15} weight="fill" />
          ))}
        </div>
        <span className="rounded-full border border-border px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Fiverr Client
        </span>
      </div>

      <p className="mt-5 text-sm leading-relaxed text-foreground">{r.text}</p>

      <div className="mt-6 border-t border-border pt-4">
        <p className="text-sm font-medium">{r.user}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          <span aria-hidden="true">{r.flag}</span> {r.country}
        </p>
        <p className="mt-3 text-[11px] uppercase tracking-wider text-muted-foreground">
          {r.value} · {r.duration}
        </p>
      </div>
    </article>
  );
}

export default function Testimonials() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".rev-head",
        { opacity: 0, y: 40, filter: "blur(10px)" },
        {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 0.9,
          scrollTrigger: { trigger: root.current, start: "top 80%" },
        },
      );
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} id="reviews" className="relative overflow-hidden px-5 py-28 sm:px-10">
      <div className="mx-auto max-w-6xl">
        <div className="rev-head flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-[11px] uppercase tracking-[0.35em] text-primary">Client Reviews</p>
            <h2 className="mt-4 text-3xl font-light tracking-tight sm:text-5xl">
              Trusted by <span className="text-gradient">Clients</span>
            </h2>
            <p className="mt-4 max-w-md text-sm text-muted-foreground">
              Real feedback from clients I&apos;ve worked with on Fiverr.
            </p>
          </div>
          <div className="glass flex items-center gap-3 rounded-2xl px-5 py-4">
            <Star size={22} weight="fill" className="text-primary" />
            <div>
              <p className="text-xl font-medium leading-none">5.0 ★</p>
              <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                Average Rating
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="marquee-mask relative mt-14">
        <div className="marquee flex w-max gap-6">
          {[0, 1].map((dup) => (
            <div key={dup} className="flex shrink-0 gap-6" aria-hidden={dup === 1}>
              {reviews.map((r) => (
                <Card key={`${dup}-${r.user}`} r={r} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
