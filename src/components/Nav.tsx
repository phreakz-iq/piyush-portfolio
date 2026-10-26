import { useEffect, useRef, useState } from "react";
import { List, X } from "@phosphor-icons/react";
import gsap from "gsap";
import ThemeToggle from "@/components/ThemeToggle";

const links = [
  { label: "Home", href: "#home" },
  { label: "About", href: "#about" },
  { label: "Work", href: "#work" },
  { label: "Book", href: "#book" },
  { label: "Contact", href: "#contact" },
];

export default function Nav() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("#home");
  const tray = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ids = links.map((l) => l.href.slice(1));
    const onScroll = () => {
      let current = "#home";
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= 160) current = `#${id}`;
      }
      setActive(current);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open || !tray.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".tray-link",
        { opacity: 0, y: 40, filter: "blur(10px)" },
        { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.6, stagger: 0.08, ease: "power3.out" },
      );
    }, tray);
    return () => ctx.revert();
  }, [open]);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 px-5 py-4 sm:px-10">
        <nav className="glass mx-auto flex max-w-6xl items-center justify-between rounded-full px-6 py-3">
          <a href="#home" className="text-sm font-medium uppercase tracking-[0.35em] text-gradient">
            Piyush
          </a>
          <div className="hidden items-center gap-8 md:flex">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="group relative text-sm text-muted-foreground transition-colors duration-300 hover:text-foreground"
              >
                {l.label}
                <span
                  className={`absolute -bottom-1.5 left-0 h-[2px] rounded-full bg-primary transition-all duration-500 ${
                    active === l.href ? "w-full opacity-100" : "w-0 opacity-0 group-hover:w-full group-hover:opacity-60"
                  }`}
                />
              </a>
            ))}
            <ThemeToggle />
            <a
              href="#contact"
              className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-all duration-500 hover:scale-105 hover:glow-ring"
            >
              Hire Me
            </a>
          </div>
          <div className="flex items-center gap-3 md:hidden">
            <ThemeToggle />
            <button aria-label="Open menu" onClick={() => setOpen(true)} className="text-foreground">
              <List size={26} weight="light" />
            </button>
          </div>
        </nav>
      </header>

      {open && (
        <div
          ref={tray}
          className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-8 bg-background/95 backdrop-blur-2xl warm-aura animate-fade-in md:hidden"
        >
          <button
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="absolute right-6 top-6 text-foreground"
          >
            <X size={28} weight="light" />
          </button>
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="tray-link text-4xl font-light tracking-tight text-foreground"
            >
              {l.label}
            </a>
          ))}
          <a
            href="#contact"
            onClick={() => setOpen(false)}
            className="tray-link mt-4 rounded-full bg-primary px-8 py-3.5 text-sm font-medium text-primary-foreground glow-ring"
          >
            Hire Me
          </a>
        </div>
      )}
    </>
  );
}
