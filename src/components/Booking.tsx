import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CalendarCheck, CheckCircle, Clock, Globe, PaperPlaneTilt } from "@phosphor-icons/react";
import { toast } from "sonner";
import MonthCalendar from "@/components/MonthCalendar";
import { ApiError, pub } from "@/lib/supabase";
import { useSiteContent } from "@/lib/site-content";
import {
  TIME_ZONE_LABEL,
  addDays,
  bookingErrorMessage,
  indiaNow,
  formatDateLong,
  formatTime,
  isDayOpen,
  parseBookingSettings,
  slotsFor,
} from "@/lib/booking";

gsap.registerPlugin(ScrollTrigger);

type BookedRow = { booking_date: string; slot_time: string };

const fieldClass =
  "w-full rounded-xl border border-border bg-input px-4 py-3 text-sm text-foreground outline-none transition-all duration-300 focus:border-accent focus:glow-ring";
const labelClass = "mb-2 block text-xs uppercase tracking-[0.2em] text-muted-foreground";

export default function Booking() {
  const root = useRef<HTMLElement>(null);
  const { settings, categories } = useSiteContent();
  const cfg = useMemo(() => parseBookingSettings(settings), [settings]);

  const [today, setToday] = useState<string | null>(null);
  const [booked, setBooked] = useState<Map<string, Set<string>>>(new Map());
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<{ date: string; time: string; email: string } | null>(null);

  // "Today" in India is worked out in the browser only, so server and browser HTML always match.
  useEffect(() => {
    setToday(indiaNow().date);
  }, []);

  const loadBooked = useCallback(async (from: string) => {
    try {
      const rows = await pub.rpc<BookedRow[]>("get_booked_slots", {
        p_from: from,
        p_to: addDays(from, 120),
      });
      const next = new Map<string, Set<string>>();
      for (const r of rows) {
        const set = next.get(r.booking_date) ?? new Set<string>();
        set.add(r.slot_time.slice(0, 5));
        next.set(r.booking_date, set);
      }
      setBooked(next);
    } catch {
      /* the database re-checks every slot when you book, so a stale list is safe */
    }
  }, []);

  useEffect(() => {
    if (today) void loadBooked(today);
  }, [today, loadBooked]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".book-reveal",
        { opacity: 0, y: 40, filter: "blur(8px)" },
        {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 0.8,
          stagger: 0.14,
          ease: "power3.out",
          scrollTrigger: { trigger: root.current, start: "top 78%" },
        },
      );
    }, root);
    return () => ctx.revert();
  }, []);

  const hasFreeSlot = useCallback(
    (iso: string) => slotsFor(iso, cfg, booked.get(iso) ?? new Set()).some((s) => s.available),
    [cfg, booked],
  );

  const slots = useMemo(
    () => (date ? slotsFor(date, cfg, booked.get(date) ?? new Set()) : []),
    [date, cfg, booked],
  );

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!date || !time || sending) return;
    const form = e.currentTarget;
    const data = new FormData(form);
    setSending(true);
    setError("");
    try {
      await pub.rpc("create_booking", {
        p_name: String(data.get("name") ?? ""),
        p_email: String(data.get("email") ?? ""),
        p_phone: String(data.get("phone") ?? ""),
        p_project_type: String(data.get("project_type") ?? ""),
        p_message: String(data.get("message") ?? ""),
        p_date: date,
        p_time: time,
      });
      setDone({ date, time, email: String(data.get("email") ?? "") });
      toast.success("Call booked — I'll confirm it by email soon.");
      form.reset();
      setTime(null);
      if (today) void loadBooked(today);
    } catch (err) {
      const msg = err instanceof ApiError ? bookingErrorMessage(err.message) : bookingErrorMessage("");
      setError(msg);
      if (today) void loadBooked(today);
      if (msg.includes("pick another") || msg.includes("Pick another")) setTime(null);
    } finally {
      setSending(false);
    }
  };

  const reset = () => {
    setDone(null);
    setDate(null);
    setTime(null);
    setError("");
  };

  return (
    <section ref={root} id="book" className="relative px-5 py-28 sm:px-10">
      <div className="glow-orb pointer-events-none absolute left-[8%] top-[18%] h-48 w-48 rounded-full bg-primary/15 blur-3xl" />
      <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.8fr_1fr]">
        <div className="book-reveal">
          <p className="text-[11px] uppercase tracking-[0.35em] text-primary">Book a Call</p>
          <h2 className="mt-4 text-3xl font-light tracking-tight sm:text-5xl">
            Pick a time, let&apos;s talk <span className="text-gradient">your film</span>
          </h2>
          <p className="mt-5 max-w-sm leading-relaxed text-muted-foreground">
            Choose a day and a slot that suits you, tell me a little about the project and I&apos;ll
            confirm the call by email.
          </p>

          <div className="mt-8 grid max-w-sm gap-3">
            <div className="glass flex items-center gap-3 rounded-2xl px-4 py-3.5">
              <Clock size={22} weight="light" className="text-primary" />
              <span className="text-sm text-foreground">{cfg.slotMinutes}-minute call</span>
            </div>
            <div className="glass flex items-center gap-3 rounded-2xl px-4 py-3.5">
              <Globe size={22} weight="light" className="text-primary" />
              <span className="text-sm text-foreground">Times in {TIME_ZONE_LABEL}</span>
            </div>
            <div className="glass flex items-center gap-3 rounded-2xl px-4 py-3.5">
              <CalendarCheck size={22} weight="light" className="text-primary" />
              <span className="text-sm text-foreground">Confirmation by email</span>
            </div>
          </div>
        </div>

        <div className="book-reveal glass rounded-3xl p-6 sm:p-8">
          {done ? (
            <div className="py-6 text-center">
              <CheckCircle size={48} weight="light" className="mx-auto text-primary" />
              <h3 className="mt-5 text-2xl font-light tracking-tight">Call requested</h3>
              <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
                {formatDateLong(done.date)} at {formatTime(done.time)}, {TIME_ZONE_LABEL}. I&apos;ll
                confirm by email at {done.email}.
              </p>
              <button
                type="button"
                onClick={reset}
                className="glass mt-8 rounded-full px-7 py-3 text-sm font-medium text-foreground transition-all duration-500 hover:scale-105 hover:text-primary hover:glow-ring"
              >
                Book another call
              </button>
            </div>
          ) : (
            <>
              {today ? (
                <MonthCalendar
                  initial={today}
                  minMonth={today}
                  maxMonth={addDays(today, cfg.maxDaysAhead)}
                  renderDay={(iso, day) => {
                    const open = isDayOpen(iso, cfg, today) && hasFreeSlot(iso);
                    const selected = date === iso;
                    return (
                      <button
                        type="button"
                        disabled={!open}
                        aria-pressed={selected}
                        aria-label={formatDateLong(iso)}
                        onClick={() => {
                          setDate(iso);
                          setTime(null);
                          setError("");
                        }}
                        className={`flex aspect-square w-full items-center justify-center rounded-xl text-sm transition-all duration-300 ${
                          selected
                            ? "bg-primary font-medium text-primary-foreground glow-ring"
                            : open
                              ? `text-foreground hover:bg-primary/10 hover:text-primary ${
                                  iso === today ? "border border-primary/50" : ""
                                }`
                              : "cursor-not-allowed text-muted-foreground/35"
                        }`}
                      >
                        {day}
                      </button>
                    );
                  }}
                />
              ) : (
                <div className="h-72" aria-hidden />
              )}

              {date && (
                <div className="mt-8 border-t border-border pt-6">
                  <p className={labelClass}>{formatDateLong(date)}</p>
                  {slots.some((s) => s.available) ? (
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {slots.map((s) => (
                        <button
                          key={s.time}
                          type="button"
                          disabled={!s.available}
                          aria-pressed={time === s.time}
                          onClick={() => {
                            setTime(s.time);
                            setError("");
                          }}
                          className={`rounded-xl border px-3 py-2.5 text-sm transition-all duration-300 ${
                            time === s.time
                              ? "border-primary bg-primary text-primary-foreground glow-ring"
                              : s.available
                                ? "border-border text-foreground hover:border-primary/50 hover:text-primary"
                                : "cursor-not-allowed border-border text-muted-foreground/35 line-through"
                          }`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No times left on this day. Pick another date.
                    </p>
                  )}
                </div>
              )}

              {date && time && (
                <form onSubmit={onSubmit} className="mt-8 border-t border-border pt-6">
                  <p className="mb-5 text-sm text-foreground">
                    {formatDateLong(date)} at {formatTime(time)}
                  </p>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label htmlFor="b-name" className={labelClass}>
                        Name
                      </label>
                      <input
                        id="b-name"
                        name="name"
                        required
                        minLength={2}
                        maxLength={100}
                        autoComplete="name"
                        className={fieldClass}
                      />
                    </div>
                    <div>
                      <label htmlFor="b-email" className={labelClass}>
                        Email
                      </label>
                      <input
                        id="b-email"
                        name="email"
                        type="email"
                        required
                        maxLength={254}
                        autoComplete="email"
                        className={fieldClass}
                      />
                    </div>
                    <div>
                      <label htmlFor="b-phone" className={labelClass}>
                        Phone <span className="normal-case tracking-normal">(optional)</span>
                      </label>
                      <input
                        id="b-phone"
                        name="phone"
                        type="tel"
                        maxLength={40}
                        autoComplete="tel"
                        className={fieldClass}
                      />
                    </div>
                    <div>
                      <label htmlFor="b-type" className={labelClass}>
                        Project type
                      </label>
                      <select id="b-type" name="project_type" defaultValue="" className={fieldClass}>
                        <option value="">Select one</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.label}>
                            {c.label}
                          </option>
                        ))}
                        <option value="Something else">Something else</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-5">
                    <label htmlFor="b-message" className={labelClass}>
                      About the project <span className="normal-case tracking-normal">(optional)</span>
                    </label>
                    <textarea
                      id="b-message"
                      name="message"
                      rows={3}
                      maxLength={1000}
                      className={`${fieldClass} resize-none`}
                    />
                  </div>

                  {error && (
                    <p role="alert" className="mt-4 text-sm text-destructive">
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={sending}
                    className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-medium text-primary-foreground transition-transform duration-300 hover:scale-[1.02] disabled:opacity-70"
                  >
                    {sending ? "Booking..." : "Book a call"} <PaperPlaneTilt size={16} weight="light" />
                  </button>
                </form>
              )}

              {!date && today && (
                <p className="mt-6 text-center text-sm text-muted-foreground">
                  Select a day to see open times.
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
