import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { admin } from "@/lib/supabase";
import { fallbackSettings, type Settings } from "@/lib/site-content";
import { fromMinutes, parseBookingSettings, toMinutes } from "@/lib/booking";
import { Field, LoadingRows, Notice, PanelHead, btnPrimary, explain, fieldClass, isHttpUrl, labelClass } from "./ui";

const DAYS: { dow: number; label: string }[] = [
  { dow: 1, label: "Mon" },
  { dow: 2, label: "Tue" },
  { dow: 3, label: "Wed" },
  { dow: 4, label: "Thu" },
  { dow: 5, label: "Fri" },
  { dow: 6, label: "Sat" },
  { dow: 0, label: "Sun" },
];

const SLOT_CHOICES = [15, 30, 45, 60, 90, 120];

export default function SitePanel({ onExpired }: { onExpired: () => void }) {
  const [saved, setSaved] = useState<Settings | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const rows = await admin.select<{ key: string; value: string }>("site_settings", "select=key,value");
      const next: Settings = { ...fallbackSettings };
      for (const r of rows) if (r.value !== "") next[r.key] = r.value;
      setSaved(next);
      setError("");
    } catch (e) {
      setError(explain(e, onExpired));
    }
  }, [onExpired]);

  useEffect(() => {
    void load();
  }, [load]);

  /** Writes only the keys that changed (keeps the activity log clean). */
  const save = async (changes: Settings) => {
    if (!saved) return;
    for (const [key, value] of Object.entries(changes)) {
      if (saved[key] === value) continue;
      await admin.upsert("site_settings", { key, value }, "key");
    }
    await load();
  };

  return (
    <div className="grid gap-8">
      <PanelHead eyebrow="Site" title="Photo, video &" accent="calendar" />
      {error && <Notice>{error}</Notice>}
      {saved === null && !error ? (
        <LoadingRows />
      ) : saved ? (
        <div className="grid gap-8">
          <LinkCard
            id="profile"
            title="Profile photo"
            hint="Shown in the About section. Paste a link to an image (.jpg, .png or .webp)."
            settingKey="profile_image_url"
            current={saved["profile_image_url"] ?? ""}
            kind="image"
            onSave={save}
            onExpired={onExpired}
          />
          <LinkCard
            id="hero"
            title="Background video"
            hint="Plays behind the top of your homepage. Paste a link to a video file (.mp4 or .webm). It plays muted and on a loop."
            settingKey="hero_video_url"
            current={saved["hero_video_url"] ?? ""}
            kind="video"
            onSave={save}
            onExpired={onExpired}
          />
          <CalendarCard saved={saved} onSave={save} onExpired={onExpired} />
        </div>
      ) : null}
    </div>
  );
}

function LinkCard({
  id,
  title,
  hint,
  settingKey,
  current,
  kind,
  onSave,
  onExpired,
}: {
  id: string;
  title: string;
  hint: string;
  settingKey: string;
  current: string;
  kind: "image" | "video";
  onSave: (c: Settings) => Promise<void>;
  onExpired: () => void;
}) {
  const [value, setValue] = useState(current);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => setValue(current), [current]);

  const valid = isHttpUrl(value);
  const changed = value.trim() !== current;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return setError("Paste a link that starts with https://");
    setBusy(true);
    setError("");
    try {
      await onSave({ [settingKey]: value.trim() });
      toast.success(`${title} updated.`);
    } catch (err) {
      setError(explain(err, onExpired));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="glass grid gap-6 rounded-3xl p-6 sm:p-8 lg:grid-cols-[1fr_18rem]">
      <div className="grid content-start gap-4">
        <p className="text-lg font-light tracking-tight">{title}</p>
        <Field id={`${id}-link`} label="Link" hint={hint}>
          <input
            id={`${id}-link`}
            type="url"
            required
            placeholder="https://"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className={fieldClass}
          />
        </Field>
        {error && <Notice>{error}</Notice>}
        <div>
          <button type="submit" disabled={busy || !changed} className={btnPrimary}>
            {busy ? "Saving..." : `Update ${kind === "image" ? "photo" : "video"}`}
          </button>
        </div>
      </div>

      <div>
        <p className={labelClass}>Preview</p>
        {valid ? (
          kind === "image" ? (
            <img
              key={value}
              src={value.trim()}
              alt="Profile photo preview"
              className="aspect-square w-full max-w-[16rem] rounded-[2rem] border border-border object-cover object-top"
            />
          ) : (
            <video
              key={value}
              src={value.trim()}
              muted
              loop
              autoPlay
              playsInline
              className="aspect-video w-full rounded-2xl border border-border bg-secondary object-cover"
            />
          )
        ) : (
          <div className="flex aspect-video w-full items-center justify-center rounded-2xl border border-dashed border-border px-4 text-center text-xs text-muted-foreground">
            Paste a link to see it here
          </div>
        )}
      </div>
    </form>
  );
}

function CalendarCard({
  saved,
  onSave,
  onExpired,
}: {
  saved: Settings;
  onSave: (c: Settings) => Promise<void>;
  onExpired: () => void;
}) {
  const cfg = parseBookingSettings(saved);
  const [start, setStart] = useState(fromMinutes(cfg.start));
  const [end, setEnd] = useState(fromMinutes(cfg.end));
  const [slot, setSlot] = useState(String(cfg.slotMinutes));
  const [off, setOff] = useState<number[]>(cfg.daysOff);
  const [ahead, setAhead] = useState(String(cfg.maxDaysAhead));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Reset the form whenever fresh values arrive from the database.
  const sig = [
    saved["booking_start"],
    saved["booking_end"],
    saved["booking_slot_minutes"],
    saved["booking_days_off"],
    saved["booking_max_days_ahead"],
  ].join("|");
  useEffect(() => {
    const c = parseBookingSettings(saved);
    setStart(fromMinutes(c.start));
    setEnd(fromMinutes(c.end));
    setSlot(String(c.slotMinutes));
    setOff(c.daysOff);
    setAhead(String(c.maxDaysAhead));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig]);

  const toggleDay = (dow: number) =>
    setOff((o) => (o.includes(dow) ? o.filter((d) => d !== dow) : [...o, dow]));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const s = toMinutes(start, -1);
    const en = toMinutes(end, -1);
    const len = Number.parseInt(slot, 10);
    const days = Number.parseInt(ahead, 10);
    if (s < 0 || en < 0 || en <= s) return setError("The end time must be after the start time.");
    if (!Number.isFinite(len) || len < 5 || len > 480) return setError("Choose a slot length.");
    if (en - s < len) return setError("The open hours are shorter than one slot.");
    if (!Number.isFinite(days) || days < 1 || days > 365) return setError("Days ahead must be between 1 and 365.");
    if (off.length >= 7) return setError("Keep at least one day open.");

    setBusy(true);
    setError("");
    try {
      await onSave({
        booking_start: fromMinutes(s),
        booking_end: fromMinutes(en),
        booking_slot_minutes: String(len),
        booking_days_off: [...off].sort((a, b) => a - b).join(","),
        booking_max_days_ahead: String(days),
      });
      toast.success("Booking calendar updated.");
    } catch (err) {
      setError(explain(err, onExpired));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="glass grid gap-6 rounded-3xl p-6 sm:p-8">
      <div>
        <p className="text-lg font-light tracking-tight">Booking calendar</p>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
          Sets which days and times visitors can pick on your site. All times are Indian time (IST). Calls
          already booked are kept.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Field id="bk-start" label="First call starts">
          <input id="bk-start" type="time" required value={start} onChange={(e) => setStart(e.target.value)} className={fieldClass} />
        </Field>
        <Field id="bk-end" label="Last call ends">
          <input id="bk-end" type="time" required value={end} onChange={(e) => setEnd(e.target.value)} className={fieldClass} />
        </Field>
        <Field id="bk-slot" label="Call length">
          <select id="bk-slot" value={slot} onChange={(e) => setSlot(e.target.value)} className={fieldClass}>
            {[...new Set([...SLOT_CHOICES, Number.parseInt(slot, 10)].filter((n) => Number.isFinite(n)))]
              .sort((a, b) => a - b)
              .map((n) => (
                <option key={n} value={n}>
                  {n} minutes
                </option>
              ))}
          </select>
        </Field>
        <Field id="bk-ahead" label="Book up to" hint="Days ahead of today.">
          <input id="bk-ahead" type="number" min={1} max={365} value={ahead} onChange={(e) => setAhead(e.target.value)} className={fieldClass} />
        </Field>
      </div>

      <div>
        <p className={labelClass}>Days you take calls</p>
        <div className="flex flex-wrap gap-2">
          {DAYS.map((d) => {
            const open = !off.includes(d.dow);
            return (
              <button
                key={d.dow}
                type="button"
                aria-pressed={open}
                onClick={() => toggleDay(d.dow)}
                className={`rounded-full border px-5 py-2 text-sm transition-all duration-300 ${
                  open
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {d.label}
              </button>
            );
          })}
        </div>
      </div>

      {error && <Notice>{error}</Notice>}
      <div>
        <button type="submit" disabled={busy} className={btnPrimary}>
          {busy ? "Saving..." : "Save calendar settings"}
        </button>
      </div>
    </form>
  );
}
