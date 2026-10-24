import { useEffect } from "react";

/** Smooth inertia scrolling (Locomotive Scroll, client-only). */
export function useSmoothScroll(enabled: boolean) {
  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    let instance: { destroy: () => void } | null = null;
    let cancelled = false;

    import("locomotive-scroll")
      .then((mod) => {
        if (cancelled) return;
        const LocomotiveScroll = mod.default;
        instance = new LocomotiveScroll({ lenisOptions: { lerp: 0.09 } }) as unknown as {
          destroy: () => void;
        };
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
      instance?.destroy();
    };
  }, [enabled]);
}
