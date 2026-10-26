import { useCallback, useEffect, useState } from "react";
import {
  ArrowClockwise,
  CaretDown,
  Gear,
  PencilSimple,
  Plus,
  SignIn,
  SignOut,
  Trash,
} from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";
import { admin } from "@/lib/supabase";
import { TIME_ZONE } from "@/lib/booking";
import { LoadingRows, Notice, PanelHead, btnGhost, chipClass, explain } from "./ui";

type LogRow = {
  id: number;
  created_at: string;
  actor: string;
  action: "insert" | "update" | "delete" | "login" | "logout" | "system";
  entity: string;
  entity_id: string | null;
  summary: string;
  details: { old?: Record<string, unknown>; new?: Record<string, unknown> } | null;
};

const PAGE = 50;

const FILTERS = [
  { id: "all", label: "Everything" },
  { id: "project", label: "Projects" },
  { id: "category", label: "Categories" },
  { id: "setting", label: "Site settings" },
  { id: "booking", label: "Bookings" },
  { id: "admin", label: "Logins" },
];

const ACTION_ICON: Record<LogRow["action"], Icon> = {
  insert: Plus,
  update: PencilSimple,
  delete: Trash,
  login: SignIn,
  logout: SignOut,
  system: Gear,
};

const ACTION_LABEL: Record<LogRow["action"], string> = {
  insert: "Added",
  update: "Changed",
  delete: "Deleted",
  login: "Logged in",
  logout: "Logged out",
  system: "System",
};

const stamp = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIME_ZONE,
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

const show = (v: unknown): string => {
  if (v === null || v === undefined || v === "") return "—";
  const s = typeof v === "string" ? v : JSON.stringify(v);
  return s.length > 140 ? `${s.slice(0, 140)}…` : s;
};

const HIDDEN_KEYS = new Set(["id", "created_at", "updated_at"]);

export default function LogPanel({ onExpired }: { onExpired: () => void }) {
  const [rows, setRows] = useState<LogRow[] | null>(null);
  const [filter, setFilter] = useState("all");
  const [more, setMore] = useState(false);
  const [open, setOpen] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const fetchPage = useCallback(
    async (offset: number) => {
      const where = filter === "all" ? "" : `&entity=eq.${filter}`;
      return admin.select<LogRow>(
        "activity_log",
        `select=*&order=created_at.desc,id.desc&limit=${PAGE + 1}&offset=${offset}${where}`,
      );
    },
    [filter],
  );

  const load = useCallback(async () => {
    setBusy(true);
    try {
      const page = await fetchPage(0);
      setRows(page.slice(0, PAGE));
      setMore(page.length > PAGE);
      setError("");
    } catch (e) {
      setError(explain(e, onExpired));
    } finally {
      setBusy(false);
    }
  }, [fetchPage, onExpired]);

  useEffect(() => {
    setRows(null);
    setOpen(null);
    void load();
  }, [load]);

  const loadMore = async () => {
    setBusy(true);
    try {
      const page = await fetchPage(rows?.length ?? 0);
      setRows((r) => [...(r ?? []), ...page.slice(0, PAGE)]);
      setMore(page.length > PAGE);
    } catch (e) {
      setError(explain(e, onExpired));
    } finally {
      setBusy(false);
    }
  };

  const changes = (r: LogRow): { key: string; before: unknown; after: unknown }[] => {
    const d = r.details;
    if (!d) return [];
    if (r.action === "update") {
      const keys = Object.keys(d.new ?? {});
      return keys.map((key) => ({ key, before: d.old?.[key], after: d.new?.[key] }));
    }
    const source = (r.action === "delete" ? d.old : d.new) ?? {};
    return Object.entries(source)
      .filter(([k]) => !HIDDEN_KEYS.has(k))
      .map(([key, value]) => ({
        key,
        before: r.action === "delete" ? value : undefined,
        after: r.action === "insert" ? value : undefined,
      }));
  };

  return (
    <div className="grid gap-8">
      <PanelHead eyebrow="History" title="Change" accent="log">
        <button type="button" onClick={() => void load()} disabled={busy} className={btnGhost}>
          <ArrowClockwise size={16} weight="light" className={busy ? "animate-spin" : ""} />
          Refresh
        </button>
      </PanelHead>

      <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
        Every change to your projects, categories, site settings and bookings is recorded here with
        who made it and when. Times are Indian time (IST).
      </p>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            aria-pressed={filter === f.id}
            onClick={() => setFilter(f.id)}
            className={`rounded-full border px-4 py-2 text-xs transition-all duration-300 ${
              filter === f.id
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && <Notice>{error}</Notice>}

      {rows === null && !error ? (
        <LoadingRows rows={5} />
      ) : (
        <div className="grid gap-3">
          {rows?.length === 0 && (
            <div className="glass rounded-2xl px-6 py-10 text-center text-sm text-muted-foreground">
              Nothing logged here yet.
            </div>
          )}
          {rows?.map((r) => {
            const Ico = ACTION_ICON[r.action] ?? Gear;
            const list = changes(r);
            const isOpen = open === r.id;
            return (
              <article key={r.id} className="glass rounded-2xl">
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : r.id)}
                  disabled={list.length === 0}
                  aria-expanded={isOpen}
                  className="flex w-full items-start gap-4 p-4 text-left sm:px-6"
                >
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-primary">
                    <Ico size={16} weight="light" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm text-foreground">{r.summary}</span>
                    <span className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span>{stamp.format(new Date(r.created_at))}</span>
                      <span>{r.actor}</span>
                      <span className={chipClass}>{ACTION_LABEL[r.action]}</span>
                    </span>
                  </span>
                  {list.length > 0 && (
                    <CaretDown
                      size={16}
                      weight="light"
                      className={`mt-2 shrink-0 text-muted-foreground transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                    />
                  )}
                </button>

                {isOpen && list.length > 0 && (
                  <dl className="grid gap-3 border-t border-border px-4 py-4 text-sm sm:px-6">
                    {list.map((c) => (
                      <div key={c.key} className="grid gap-1 sm:grid-cols-[10rem_1fr] sm:gap-4">
                        <dt className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                          {c.key.replace(/_/g, " ")}
                        </dt>
                        <dd className="min-w-0 break-words">
                          {r.action === "update" ? (
                            <>
                              <span className="text-muted-foreground line-through">{show(c.before)}</span>
                              <span className="mx-2 text-primary">→</span>
                              <span>{show(c.after)}</span>
                            </>
                          ) : (
                            show(r.action === "delete" ? c.before : c.after)
                          )}
                        </dd>
                      </div>
                    ))}
                  </dl>
                )}
              </article>
            );
          })}

          {more && (
            <div className="pt-2 text-center">
              <button type="button" onClick={() => void loadMore()} disabled={busy} className={btnGhost}>
                {busy ? "Loading..." : "Show older changes"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
