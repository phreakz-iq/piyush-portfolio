import { useCallback, useEffect, useState } from "react";
import {
  ArrowSquareOut,
  CalendarCheck,
  Folders,
  ListChecks,
  LockKey,
  SignOut,
  SlidersHorizontal,
  Tag,
} from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";
import ThemeToggle from "@/components/ThemeToggle";
import { ApiError, hasSession, sessionEmail, signIn, signOut, verifyAdmin } from "@/lib/supabase";
import BookingsPanel from "./BookingsPanel";
import ProjectsPanel from "./ProjectsPanel";
import CategoriesPanel from "./CategoriesPanel";
import SitePanel from "./SitePanel";
import LogPanel from "./LogPanel";
import { Field, Notice, btnPrimary, fieldClass } from "./ui";

type Tab = "bookings" | "projects" | "categories" | "site" | "log";

const TABS: { id: Tab; label: string; icon: Icon }[] = [
  { id: "bookings", label: "Bookings", icon: CalendarCheck },
  { id: "projects", label: "Projects", icon: Folders },
  { id: "categories", label: "Categories", icon: Tag },
  { id: "site", label: "Site", icon: SlidersHorizontal },
  { id: "log", label: "Change log", icon: ListChecks },
];

export default function AdminPage() {
  const [state, setState] = useState<"checking" | "out" | "in">("checking");
  const [email, setEmail] = useState("");

  useEffect(() => {
    let alive = true;
    if (!hasSession()) {
      setState("out");
      return;
    }
    void verifyAdmin().then((ok) => {
      if (!alive) return;
      setEmail(sessionEmail());
      setState(ok ? "in" : "out");
    });
    return () => {
      alive = false;
    };
  }, []);

  const expired = useCallback(() => setState("out"), []);

  return (
    <div className="relative min-h-screen overflow-x-hidden warm-aura">
      <div className="grain-grid pointer-events-none absolute inset-x-0 top-0 h-[70vh] opacity-60 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
      {state === "checking" && (
        <div className="relative flex min-h-screen items-center justify-center text-sm text-muted-foreground" aria-busy="true">
          Checking your session...
        </div>
      )}
      {state === "out" && (
        <Login
          onDone={(e) => {
            setEmail(e);
            setState("in");
          }}
        />
      )}
      {state === "in" && (
        <Dashboard
          email={email}
          onExpired={expired}
          onLogout={async () => {
            await signOut();
            setState("out");
          }}
        />
      )}
    </div>
  );
}

function Login({ onDone }: { onDone: (email: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setBusy(true);
    setError("");
    try {
      const who = await signIn(String(data.get("email") ?? ""), String(data.get("password") ?? ""));
      onDone(who);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't log in. Try again.");
      setBusy(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center px-5 py-16">
      <div className="absolute right-5 top-5 sm:right-10 sm:top-8">
        <ThemeToggle />
      </div>
      <form onSubmit={submit} className="glass w-full max-w-md rounded-3xl p-8 sm:p-10">
        <div className="flex justify-center">
          <span className="glass flex h-14 w-14 items-center justify-center rounded-full text-primary glow-ring">
            <LockKey size={26} weight="light" />
          </span>
        </div>
        <p className="mt-6 text-center text-sm font-medium uppercase tracking-[0.35em] text-gradient">Piyush</p>
        <h1 className="mt-4 text-center text-3xl font-light tracking-tight">Admin login</h1>
        <p className="mt-3 text-center text-sm text-muted-foreground">
          Log in to manage your projects, links and calls.
        </p>

        <div className="mt-8 grid gap-5">
          <Field id="a-email" label="Email">
            <input
              id="a-email"
              name="email"
              type="email"
              required
              autoComplete="username"
              className={fieldClass}
            />
          </Field>
          <Field id="a-pass" label="Password">
            <input
              id="a-pass"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className={fieldClass}
            />
          </Field>
        </div>

        {error && (
          <div className="mt-5">
            <Notice>{error}</Notice>
          </div>
        )}

        <button type="submit" disabled={busy} className={`${btnPrimary} mt-7 w-full py-3.5`}>
          {busy ? "Logging in..." : "Log in"}
        </button>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          You'll log in again each time you open this page in a new tab.
        </p>
      </form>
    </main>
  );
}

function Dashboard({
  email,
  onExpired,
  onLogout,
}: {
  email: string;
  onExpired: () => void;
  onLogout: () => Promise<void>;
}) {
  const [tab, setTab] = useState<Tab>("bookings");
  const [leaving, setLeaving] = useState(false);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 px-5 py-4 sm:px-10">
        <div className="glass mx-auto flex max-w-6xl items-center justify-between gap-4 rounded-full px-5 py-3 sm:px-6">
          <div className="flex items-baseline gap-3">
            <span className="text-sm font-medium uppercase tracking-[0.35em] text-gradient">Piyush</span>
            <span className="hidden text-xs text-muted-foreground sm:inline">Admin</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="hidden max-w-[14rem] truncate text-xs text-muted-foreground md:inline">{email}</span>
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="View site"
              title="View site"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-all duration-300 hover:border-primary/40 hover:text-primary hover:glow-ring"
            >
              <ArrowSquareOut size={18} weight="light" />
            </a>
            <ThemeToggle />
            <button
              type="button"
              disabled={leaving}
              onClick={async () => {
                setLeaving(true);
                await onLogout();
              }}
              className="inline-flex h-9 items-center gap-2 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground transition-all duration-500 hover:scale-105 hover:glow-ring disabled:opacity-60"
            >
              <SignOut size={16} weight="light" />
              <span className="hidden sm:inline">Log out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-6xl px-5 pb-24 pt-28 sm:px-10 sm:pt-32">
        <nav className="overflow-x-auto" aria-label="Admin sections">
          <div role="tablist" className="inline-flex min-w-full gap-1 border-b border-border sm:min-w-0 sm:gap-2">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
                className={`relative inline-flex items-center gap-2 whitespace-nowrap px-4 py-3 text-[11px] uppercase tracking-[0.28em] transition-colors duration-300 sm:px-6 sm:text-xs ${
                  tab === t.id ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <t.icon size={16} weight="light" />
                {t.label}
                {tab === t.id && (
                  <span className="absolute inset-x-0 bottom-0 h-[2px] rounded-full bg-primary glow-ring" />
                )}
              </button>
            ))}
          </div>
        </nav>

        <div className="mt-10" role="tabpanel">
          {tab === "bookings" && <BookingsPanel onExpired={onExpired} />}
          {tab === "projects" && <ProjectsPanel onExpired={onExpired} />}
          {tab === "categories" && <CategoriesPanel onExpired={onExpired} />}
          {tab === "site" && <SitePanel onExpired={onExpired} />}
          {tab === "log" && <LogPanel onExpired={onExpired} />}
        </div>
      </main>
    </>
  );
}
