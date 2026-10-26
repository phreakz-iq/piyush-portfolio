import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowClockwise,
  CalendarBlank,
  CheckCircle,
  EnvelopeSimple,
  Phone,
  Trash,
  XCircle,
} from "@phosphor-icons/react";
import MonthCalendar from "@/components/MonthCalendar";
import { admin, eq } from "@/lib/supabase";
import { useSiteContent } from "@/lib/site-content";
import {
  TIME_ZONE_LABEL,
  indiaNow,
  dowOf,
  formatDateLong,
  formatDateShort,
  formatTime,
  parseBookingSettings,
  type Booking,
  type BookingStatus,
} from "@/lib/booking";
import {
  ConfirmButton,
  LoadingRows,
  Notice,
  PanelHead,
  btnGhost,
  chipClass,
  explain,
} from "./ui";

const STATUS_LABEL: Record<BookingStatus, string> = {
  pending: "Waiting for reply",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
};

const STATUS_STYLE: Record<BookingStatus, string> = {
  pending: "border-primary/50 bg-primary/10 text-primary",
  confirmed: "border-accent/60 bg-accent/10 text-foreground",
  completed: "border-border text-muted-foreground",
  cancelled: "border-border text-muted-foreground line-through",
};

/** Which status colours a calendar day: waiting > confirmed > completed. */
function dayStatus(list: Booking[]): BookingStatus | null {
  const live = list.filter((b) => b.status !== "cancelled");
  if (live.length === 0) return null;
  if (live.some((b) => b.status === "pending")) return "pending";
  if (live.some((b) => b.status === "confirmed")) return "confirmed";
  return "completed";
}

export default function BookingsPanel({ onExpired }: { onExpired: () => void }) {
  const { settings } = useSiteContent();
  const cfg = useMemo(() => parseBookingSettings(settings), [settings]);
  const [today] = useState(() => indiaNow().date);

  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [selected, setSelected] = useState<string>(today);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const rows = await admin.select<Booking>(
        "bookings",
        "select=*&order=booking_date.asc,slot_time.asc&limit=1000",
      );
      setBookings(rows);
      setError("");
    } catch (e) {
      setError(explain(e, onExpired));
    } finally {
      setRefreshing(false);
    }
  }, [onExpired]);

  useEffect(() => {
    void load();
    const t = window.setInterval(() => void load(), 30000);
    return () => window.clearInterval(t);
  }, [load]);

  const byDate = useMemo(() => {
    const map = new Map<string, Booking[]>();
    for (const b of bookings ?? []) {
      const list = map.get(b.booking_date) ?? [];
      list.push(b);
      map.set(b.booking_date, list);
    }
    return map;
  }, [bookings]);

  const waiting = useMemo(
    () => (bookings ?? []).filter((b) => b.status === "pending" && b.booking_date >= today),
    [bookings, today],
  );
  const upcomingConfirmed = useMemo(
    () => (bookings ?? []).filter((b) => b.status === "confirmed" && b.booking_date >= today),
    [bookings, today],
  );
  const todayCount = (byDate.get(today) ?? []).filter((b) => b.status !== "cancelled").length;

  const setStatus = async (b: Booking, status: BookingStatus) => {
    setBusy(b.id);
    setError("");
    try {
      await admin.update("bookings", eq("id", b.id), { status });
      await load();
    } catch (e) {
      setError(explain(e, onExpired));
    } finally {
      setBusy(null);
    }
  };

  const remove = async (b: Booking) => {
    setBusy(b.id);
    setError("");
    try {
      await admin.remove("bookings", eq("id", b.id));
      await load();
    } catch (e) {
      setError(explain(e, onExpired));
    } finally {
      setBusy(null);
    }
  };

  const dayList = byDate.get(selected) ?? [];

  return (
    <div className="grid gap-8">
      <PanelHead eyebrow="Calendar" title="Call" accent="bookings">
        <button type="button" onClick={() => void load()} disabled={refreshing} className={btnGhost}>
          <ArrowClockwise size={16} weight="light" className={refreshing ? "animate-spin" : ""} />
          Refresh
        </button>
      </PanelHead>

      {error && <Notice>{error}</Notice>}

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Waiting for your reply", value: waiting.length, hot: waiting.length > 0 },
          { label: "Confirmed and upcoming", value: upcomingConfirmed.length, hot: false },
          { label: "Calls today", value: todayCount, hot: false },
        ].map((s) => (
          <div key={s.label} className="glass rounded-2xl px-5 py-4">
            <p className={`text-3xl font-light leading-none ${s.hot ? "text-primary" : ""}`}>{s.value}</p>
            <p className="mt-2 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {bookings === null && !error ? (
        <LoadingRows />
      ) : (
        <div className="grid items-start gap-8 lg:grid-cols-[1fr_1fr]">
          <div className="glass rounded-3xl p-6 sm:p-8">
            <MonthCalendar
              initial={selected}
              renderDay={(iso, day) => {
                const list = byDate.get(iso) ?? [];
                const status = dayStatus(list);
                const live = list.filter((b) => b.status !== "cancelled").length;
                const isSelected = selected === iso;
                const off = cfg.daysOff.includes(dowOf(iso));
                return (
                  <button
                    type="button"
                    onClick={() => setSelected(iso)}
                    aria-pressed={isSelected}
                    aria-label={`${formatDateLong(iso)}, ${live} ${live === 1 ? "call" : "calls"}`}
                    className={`relative flex aspect-square w-full items-center justify-center rounded-xl text-sm transition-all duration-300 ${
                      isSelected
                        ? "border border-primary bg-primary/10 text-foreground glow-ring"
                        : iso === today
                          ? "border border-primary/40 text-foreground hover:bg-primary/10"
                          : off
                            ? "text-muted-foreground/40 hover:bg-secondary"
                            : "text-foreground hover:bg-primary/10"
                    }`}
                  >
                    {day}
                    {status && (
                      <span
                        className={`absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-medium ${
                          status === "pending"
                            ? "bg-primary text-primary-foreground"
                            : status === "confirmed"
                              ? "bg-accent text-accent-foreground"
                              : "bg-muted-foreground/30 text-foreground"
                        }`}
                      >
                        {live}
                      </span>
                    )}
                  </button>
                );
              }}
            />
            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 border-t border-border pt-4 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-primary" /> Waiting for reply
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-accent" /> Confirmed
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/40" /> Completed
              </span>
            </div>
          </div>

          <div className="grid gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.35em] text-primary">
                {selected === today ? "Today" : formatDateShort(selected)}
              </p>
              <p className="mt-2 text-lg font-light tracking-tight">{formatDateLong(selected)}</p>
            </div>

            {dayList.length === 0 ? (
              <div className="glass flex items-center gap-3 rounded-2xl px-5 py-6 text-sm text-muted-foreground">
                <CalendarBlank size={22} weight="light" className="text-primary" />
                No calls on this day.
              </div>
            ) : (
              dayList.map((b) => (
                <article
                  key={b.id}
                  className={`glass rounded-2xl p-5 transition-opacity ${b.status === "cancelled" ? "opacity-60" : ""}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-base font-medium">
                      {formatTime(b.slot_time)}{" "}
                      <span className="text-xs font-normal text-muted-foreground">{TIME_ZONE_LABEL}</span>
                    </p>
                    <span
                      className={`rounded-full border px-3 py-1 text-[11px] uppercase tracking-wider ${STATUS_STYLE[b.status]}`}
                    >
                      {STATUS_LABEL[b.status]}
                    </span>
                  </div>

                  <p className="mt-4 text-sm font-medium">{b.name}</p>
                  <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
                    <a
                      href={`mailto:${b.email}`}
                      className="inline-flex items-center gap-2 transition-colors hover:text-primary"
                    >
                      <EnvelopeSimple size={16} weight="light" /> {b.email}
                    </a>
                    {b.phone && (
                      <a
                        href={`tel:${b.phone}`}
                        className="inline-flex items-center gap-2 transition-colors hover:text-primary"
                      >
                        <Phone size={16} weight="light" /> {b.phone}
                      </a>
                    )}
                  </div>
                  {b.project_type && <span className={`${chipClass} mt-3 inline-block`}>{b.project_type}</span>}
                  {b.message && (
                    <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                      {b.message}
                    </p>
                  )}

                  <div className="mt-5 flex flex-wrap items-center gap-2">
                    {b.status === "pending" && (
                      <button
                        type="button"
                        disabled={busy === b.id}
                        onClick={() => void setStatus(b, "confirmed")}
                        className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-medium text-primary-foreground transition-all duration-300 hover:scale-105 disabled:opacity-60"
                      >
                        <CheckCircle size={16} weight="light" /> Confirm
                      </button>
                    )}
                    {b.status === "confirmed" && (
                      <button
                        type="button"
                        disabled={busy === b.id}
                        onClick={() => void setStatus(b, "completed")}
                        className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-medium text-primary-foreground transition-all duration-300 hover:scale-105 disabled:opacity-60"
                      >
                        <CheckCircle size={16} weight="light" /> Mark completed
                      </button>
                    )}
                    {(b.status === "pending" || b.status === "confirmed") && (
                      <button
                        type="button"
                        disabled={busy === b.id}
                        onClick={() => void setStatus(b, "cancelled")}
                        className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs text-muted-foreground transition-all duration-300 hover:border-destructive/50 hover:text-destructive disabled:opacity-60"
                      >
                        <XCircle size={16} weight="light" /> Cancel call
                      </button>
                    )}
                    {b.status === "cancelled" && (
                      <button
                        type="button"
                        disabled={busy === b.id}
                        onClick={() => void setStatus(b, "pending")}
                        className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs text-muted-foreground transition-all duration-300 hover:text-primary disabled:opacity-60"
                      >
                        Restore
                      </button>
                    )}
                    <span className="ml-auto">
                      <ConfirmButton
                        disabled={busy === b.id}
                        onConfirm={() => void remove(b)}
                        label="Delete booking"
                        confirmLabel="Sure? Delete"
                      >
                        <Trash size={16} weight="light" />
                      </ConfirmButton>
                    </span>
                  </div>
                </article>
              ))
            )}

            {waiting.length > 0 && (
              <div className="mt-2">
                <p className="mb-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Waiting for your reply
                </p>
                <div className="grid gap-2">
                  {waiting.slice(0, 6).map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setSelected(b.booking_date)}
                      className="glass flex items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left text-sm transition-all duration-300 hover:text-primary hover:glow-ring"
                    >
                      <span className="truncate">{b.name}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {formatDateShort(b.booking_date)} · {formatTime(b.slot_time)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
