import { useState, type ReactNode } from "react";
import { ApiError } from "@/lib/supabase";

/* Shared look for the admin page — same tokens, glass cards and pills as the public site. */

export const fieldClass =
  "w-full rounded-xl border border-border bg-input px-4 py-3 text-sm text-foreground outline-none transition-all duration-300 focus:border-accent focus:glow-ring";

export const labelClass =
  "mb-2 block text-xs uppercase tracking-[0.2em] text-muted-foreground";

export const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-all duration-300 hover:scale-[1.03] hover:glow-ring disabled:pointer-events-none disabled:opacity-60";

export const btnGhost =
  "glass inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm text-foreground transition-all duration-300 hover:text-primary hover:glow-ring disabled:pointer-events-none disabled:opacity-50";

export const iconBtn =
  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-all duration-300 hover:border-primary/40 hover:text-primary disabled:pointer-events-none disabled:opacity-30";

export const chipClass =
  "rounded-full border border-border px-3 py-1 text-[11px] uppercase tracking-wider text-muted-foreground";

export function Field({
  id,
  label,
  hint,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      {children}
      {hint && <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function PanelHead({
  eyebrow,
  title,
  accent,
  children,
}: {
  eyebrow: string;
  title: string;
  accent: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-[11px] uppercase tracking-[0.35em] text-primary">{eyebrow}</p>
        <h2 className="mt-4 text-3xl font-light tracking-tight sm:text-4xl">
          {title} <span className="text-gradient">{accent}</span>
        </h2>
      </div>
      {children && <div className="flex flex-wrap items-center gap-3">{children}</div>}
    </div>
  );
}

export function Notice({ children, tone = "error" }: { children: ReactNode; tone?: "error" | "info" }) {
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={`rounded-2xl border px-4 py-3 text-sm ${
        tone === "error"
          ? "border-destructive/40 text-destructive"
          : "border-border text-muted-foreground"
      }`}
    >
      {children}
    </p>
  );
}

/** Delete button that asks once more before doing anything. */
export function ConfirmButton({
  onConfirm,
  label = "Delete",
  confirmLabel = "Sure? Delete",
  disabled,
  title,
  children,
}: {
  onConfirm: () => void;
  label?: string;
  confirmLabel?: string;
  disabled?: boolean;
  title?: string;
  children?: ReactNode;
}) {
  const [armed, setArmed] = useState(false);
  return (
    <button
      type="button"
      disabled={disabled}
      title={title}
      aria-label={armed ? confirmLabel : label}
      onClick={() => {
        if (!armed) {
          setArmed(true);
          window.setTimeout(() => setArmed(false), 3500);
          return;
        }
        setArmed(false);
        onConfirm();
      }}
      className={
        armed
          ? "inline-flex h-9 items-center gap-2 rounded-full bg-destructive px-4 text-xs font-medium text-destructive-foreground transition-all duration-300"
          : "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-all duration-300 hover:border-destructive/50 hover:text-destructive disabled:pointer-events-none disabled:opacity-30"
      }
    >
      {armed ? confirmLabel : children}
    </button>
  );
}

export const isHttpUrl = (v: string) => /^https?:\/\/\S+$/i.test(v.trim());

/** Turns any error into plain words, and signs out if the session has ended. */
export function explain(e: unknown, onExpired: () => void): string {
  if (e instanceof ApiError) {
    if (e.code === "no_session" || e.status === 401) {
      onExpired();
      return "Your session has ended. Log in again.";
    }
    if (e.code === "23503") return "That's still in use. Move or delete the projects inside it first.";
    if (e.code === "23505") return "Something with that name or ID already exists.";
    if (e.code === "23514") return "One of the values isn't allowed. Check the fields and try again.";
    if (e.status === 403 || e.code === "42501") return "You don't have permission to do that.";
    return e.message;
  }
  return "Something went wrong. Try again.";
}

export function slugify(label: string): string {
  return label
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function LoadingRows({ rows = 3 }: { rows?: number }) {
  return (
    <div className="grid gap-3" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="glass h-20 animate-pulse rounded-2xl" />
      ))}
    </div>
  );
}
