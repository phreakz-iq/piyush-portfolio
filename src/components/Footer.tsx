import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { InstagramLogo, LinkedinLogo } from "@phosphor-icons/react";
import FiverrLogo from "@/components/icons/FiverrLogo";

gsap.registerPlugin(ScrollTrigger);

export default function Footer() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".footer-inner",
        { opacity: 0, y: 60, filter: "blur(10px)" },
        {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 1,
          ease: "power3.out",
          scrollTrigger: { trigger: root.current, start: "top 92%" },
        },
      );
      gsap.to(".footer-orb", {
        y: -18,
        duration: 3.4,
        repeat: -1,
        yoyo: true,
        ease: "power1.inOut",
        stagger: 0.4,
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <footer ref={root} className="relative overflow-hidden border-t border-border px-5 py-14 sm:px-10">
      <div className="footer-orb pointer-events-none absolute left-[20%] top-6 h-24 w-24 rounded-full bg-primary/20 blur-3xl" />
      <div className="footer-orb pointer-events-none absolute right-[18%] bottom-4 h-28 w-28 rounded-full bg-accent/15 blur-3xl" />
      <div className="footer-inner relative mx-auto flex max-w-6xl flex-col items-center gap-6 sm:flex-row sm:justify-between">
        <span className="text-sm uppercase tracking-[0.35em] text-gradient">Piyush</span>
        <nav className="flex gap-6 text-sm text-muted-foreground">
          <a href="#home" className="transition-colors hover:text-foreground">Home</a>
          <a href="#about" className="transition-colors hover:text-foreground">About</a>
          <a href="#work" className="transition-colors hover:text-foreground">Work</a>
          <a href="#contact" className="transition-colors hover:text-foreground">Contact</a>
        </nav>
        <div className="flex gap-3">
          <a href="https://www.fiverr.com/piyush_uikey22" target="_blank" rel="noopener noreferrer" aria-label="Fiverr" className="text-muted-foreground transition-colors hover:text-primary">
            <FiverrLogo size={20} />
          </a>
          <a href="https://www.linkedin.com/in/piyush-uikey-69b8223b7" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="text-muted-foreground transition-colors hover:text-primary">
            <LinkedinLogo size={20} weight="light" />
          </a>
          <a href="https://www.instagram.com/piyush_uikey22/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-muted-foreground transition-colors hover:text-primary">
            <InstagramLogo size={20} weight="light" />
          </a>
        </div>
      </div>
      <p className="relative mt-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Piyush. Crafted with motion.
      </p>
    </footer>
  );
}
