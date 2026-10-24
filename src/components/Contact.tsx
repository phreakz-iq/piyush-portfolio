import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { InstagramLogo, LinkedinLogo, PaperPlaneTilt } from "@phosphor-icons/react";
import FiverrLogo from "@/components/icons/FiverrLogo";
import { toast } from "sonner";

gsap.registerPlugin(ScrollTrigger);

export default function Contact() {
  const root = useRef<HTMLElement>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".contact-field",
        { opacity: 0, x: -50, filter: "blur(8px)" },
        {
          opacity: 1,
          x: 0,
          filter: "blur(0px)",
          duration: 0.7,
          stagger: 0.12,
          ease: "power3.out",
          scrollTrigger: { trigger: root.current, start: "top 75%" },
        },
      );
      gsap.to(".contact-submit", {
        boxShadow: "0 0 45px -6px var(--primary)",
        duration: 1.6,
        repeat: -1,
        yoyo: true,
        ease: "power1.inOut",
      });
    }, root);
    return () => ctx.revert();
  }, []);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSending(true);
    gsap.fromTo(
      ".contact-submit",
      { scale: 0.94 },
      { scale: 1, duration: 0.6, ease: "elastic.out(1, 0.4)" },
    );
    setTimeout(() => {
      setSending(false);
      toast.success("Message sent — I'll get back to you soon.");
      (e.target as HTMLFormElement).reset();
    }, 700);
  };

  return (
    <section ref={root} id="contact" className="relative px-5 py-28 sm:px-10">
      <div className="glow-orb pointer-events-none absolute right-[10%] top-[20%] h-48 w-48 rounded-full bg-accent/15 blur-3xl" />
      <div className="mx-auto grid max-w-5xl gap-12 lg:grid-cols-2">
        <div className="contact-field">
          <p className="text-[11px] uppercase tracking-[0.35em] text-primary">Contact</p>
          <h2 className="mt-4 text-3xl font-light tracking-tight sm:text-5xl">
            Let&apos;s build something <span className="text-gradient">unforgettable</span>
          </h2>
          <p className="mt-5 max-w-sm leading-relaxed text-muted-foreground">
            Got a film, campaign or reel in mind? Send a note and I&apos;ll reply within 24 hours.
          </p>
          <div className="mt-8 flex gap-4">
            <a
              href="https://www.fiverr.com/piyush_uikey22"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Fiverr"
              className="glass rounded-full p-3 text-muted-foreground transition-all duration-300 hover:text-primary hover:glow-ring"
            >
              <FiverrLogo size={22} />
            </a>
            <a
              href="https://www.linkedin.com/in/piyush-uikey-69b8223b7"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              className="glass rounded-full p-3 text-muted-foreground transition-all duration-300 hover:text-primary hover:glow-ring"
            >
              <LinkedinLogo size={22} weight="light" />
            </a>
            <a
              href="https://www.instagram.com/piyush_uikey22/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="glass rounded-full p-3 text-muted-foreground transition-all duration-300 hover:text-primary hover:glow-ring"
            >
              <InstagramLogo size={22} weight="light" />
            </a>
          </div>
        </div>

        <form onSubmit={onSubmit} className="glass rounded-3xl p-6 sm:p-8">
          {[
            { name: "name", label: "Name", type: "text" },
            { name: "email", label: "Email", type: "email" },
          ].map((f) => (
            <div key={f.name} className="contact-field mb-5">
              <label htmlFor={f.name} className="mb-2 block text-xs uppercase tracking-[0.2em] text-muted-foreground">
                {f.label}
              </label>
              <input
                id={f.name}
                name={f.name}
                type={f.type}
                required
                className="w-full rounded-xl border border-border bg-input px-4 py-3 text-sm text-foreground outline-none transition-all duration-300 focus:border-accent focus:glow-ring"
              />
            </div>
          ))}
          <div className="contact-field mb-6">
            <label htmlFor="message" className="mb-2 block text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Message
            </label>
            <textarea
              id="message"
              name="message"
              rows={4}
              required
              className="w-full resize-none rounded-xl border border-border bg-input px-4 py-3 text-sm text-foreground outline-none transition-all duration-300 focus:border-accent focus:glow-ring"
            />
          </div>
          <button
            type="submit"
            disabled={sending}
            className="contact-submit inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-medium text-primary-foreground transition-transform duration-300 hover:scale-[1.02]"
          >
            {sending ? "Sending..." : "Send Message"} <PaperPlaneTilt size={16} weight="light" />
          </button>
        </form>
      </div>
    </section>
  );
}
