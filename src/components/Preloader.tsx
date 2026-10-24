import { useEffect, useRef, useState } from "react";

export default function Preloader({ onDone }: { onDone: () => void }) {
  const root = useRef<HTMLDivElement>(null);
  const [pct, setPct] = useState(0);
  const [exiting, setExiting] = useState(false);
  const doneRef = useRef(false);

  useEffect(() => {
    if (doneRef.current) return;

    const duration = 2200;
    const start = performance.now();

    const tick = () => {
      const elapsed = performance.now() - start;
      const next = Math.min(100, Math.round((elapsed / duration) * 100));
      setPct(next);
      if (next < 100) {
        frame = requestAnimationFrame(tick);
      } else {
        setExiting(true);
        timer = window.setTimeout(() => {
          if (!doneRef.current) {
            doneRef.current = true;
            onDone();
          }
        }, 1100);
      }
    };

    let frame = requestAnimationFrame(tick);
    let timer: number | undefined;

    // Hard fallback so the site never stays stuck
    const fallback = window.setTimeout(() => {
      if (!doneRef.current) {
        doneRef.current = true;
        onDone();
      }
    }, 4500);

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(timer);
      window.clearTimeout(fallback);
    };
  }, [onDone]);

  return (
    <div
      ref={root}
      className={`preloader-root fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background warm-aura grain transition-all duration-900 ease-in-out ${exiting ? "pointer-events-none opacity-0 scale-[0.94] blur-[12px]" : "opacity-100"}`}
    >
      <div className="absolute inset-0 grain-grid opacity-60" />
      <div className="pre-name relative text-4xl font-light uppercase tracking-[0.25em] text-gradient sm:text-6xl">
        Piyush
      </div>
      <div className="pre-progress relative mt-10 w-56 sm:w-80">
        <div className="h-[3px] w-full overflow-hidden rounded-full bg-secondary">
          <div
            className="progress-bar h-full rounded-full bg-primary glow-ring transition-all duration-100 ease-linear"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="mt-3 flex justify-between text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
          <span>Loading</span>
          <span>{pct}%</span>
        </div>
      </div>
    </div>
  );
}
