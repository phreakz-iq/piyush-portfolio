import { Moon, Sun } from "@phosphor-icons/react";

const STORAGE_KEY = "theme";

export default function ThemeToggle({ className = "" }: { className?: string }) {
  const toggle = () => {
    const root = document.documentElement;
    const apply = () => {
      const next = root.classList.contains("dark") ? "light" : "dark";
      root.classList.toggle("dark", next === "dark");
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        /* storage unavailable (private mode) — theme still switches for this visit */
      }
    };

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const withTransition = document as Document & {
      startViewTransition?: (cb: () => void) => unknown;
    };
    if (withTransition.startViewTransition && !reduceMotion) {
      withTransition.startViewTransition(apply);
    } else {
      apply();
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle light and dark theme"
      title="Toggle theme"
      className={`relative flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-all duration-300 hover:border-primary/40 hover:text-primary hover:glow-ring ${className}`}
    >
      <span className="relative block h-[18px] w-[18px]">
        <Sun
          size={18}
          weight="light"
          className="absolute inset-0 rotate-0 scale-100 opacity-100 transition-all duration-500 dark:-rotate-90 dark:scale-0 dark:opacity-0"
        />
        <Moon
          size={18}
          weight="light"
          className="absolute inset-0 rotate-90 scale-0 opacity-0 transition-all duration-500 dark:rotate-0 dark:scale-100 dark:opacity-100"
        />
      </span>
    </button>
  );
}
