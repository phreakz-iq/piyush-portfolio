import type { Settings } from "@/lib/site-content";

/** All booking times are in Indian time (the database checks them in Asia/Kolkata too). */
export const TIME_ZONE = "Asia/Kolkata";
export const TIME_ZONE_LABEL = "Indian time (IST, GMT+5:30)";

export type BookingSettings = {
  /** minutes from midnight */
  start: number;
  end: number;
  slotMinutes: number;
  /** 0 = Sunday … 6 = Saturday */
  daysOff: number[];
  maxDaysAhead: number;
};

export type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled";

export type Booking = {
  id: string;
  name: string;
  email: string;
  phone: string;
  project_type: string;
  message: string;
  booking_date: string; // YYYY-MM-DD
  slot_time: string; // HH:MM:SS
  status: BookingStatus;
  created_at: string;
};

const pad = (n: number) => String(n).padStart(2, "0");

export function toMinutes(hhmm: string, fallback: number): number {
  const m = /^(\d{1,2}):(\d{2})/.exec(hhmm);
  if (!m) return fallback;
  return Number(m[1]) * 60 + Number(m[2]);
}

export function fromMinutes(total: number): string {
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
}

export function parseBookingSettings(s: Settings): BookingSettings {
  const slot = Number(s["booking_slot_minutes"]);
  const ahead = Number(s["booking_max_days_ahead"]);
  return {
    start: toMinutes(s["booking_start"] ?? "", 600),
    end: toMinutes(s["booking_end"] ?? "", 1080),
    slotMinutes: Number.isFinite(slot) && slot >= 5 ? slot : 60,
    daysOff: (s["booking_days_off"] ?? "")
      .split(",")
      .map((d) => d.trim())
      .filter((d) => d !== "")
      .map(Number)
      .filter((d) => Number.isInteger(d) && d >= 0 && d <= 6),
    maxDaysAhead: Number.isFinite(ahead) && ahead > 0 ? ahead : 60,
  };
}

export const isoOf = (y: number, m0: number, d: number) => `${y}-${pad(m0 + 1)}-${pad(d)}`;

export function parseISO(iso: string): { y: number; m0: number; d: number } {
  const [y = 1970, m = 1, d = 1] = iso.split("-").map(Number);
  return { y, m0: m - 1, d };
}

export function dowOf(iso: string): number {
  const { y, m0, d } = parseISO(iso);
  return new Date(Date.UTC(y, m0, d)).getUTCDay();
}

export function addDays(iso: string, n: number): string {
  const { y, m0, d } = parseISO(iso);
  const t = new Date(Date.UTC(y, m0, d + n));
  return isoOf(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate());
}

/** Current date and minutes-from-midnight in India. */
export function indiaNow(): { date: string; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  return {
    date: isoOf(get("year"), get("month") - 1, get("day")),
    minutes: get("hour") * 60 + get("minute"),
  };
}

/** Same rules the database enforces: open weekday, today or later, inside the booking window. */
export function isDayOpen(iso: string, s: BookingSettings, todayISO: string): boolean {
  if (iso < todayISO) return false;
  if (iso > addDays(todayISO, s.maxDaysAhead)) return false;
  return !s.daysOff.includes(dowOf(iso));
}

export type Slot = { time: string; label: string; available: boolean };

export function formatTime(hhmm: string): string {
  const mins = toMinutes(hhmm, 0);
  const h = Math.floor(mins / 60);
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${pad(mins % 60)} ${suffix}`;
}

/** Every slot for a day; `taken` holds "HH:MM" strings that are already booked. */
export function slotsFor(iso: string, s: BookingSettings, taken: Set<string>): Slot[] {
  const now = indiaNow();
  const out: Slot[] = [];
  for (let m = s.start; m + s.slotMinutes <= s.end; m += s.slotMinutes) {
    const time = fromMinutes(m);
    // The database needs at least 60 minutes of notice.
    const tooSoon = iso === now.date && m < now.minutes + 60;
    out.push({ time, label: formatTime(time), available: !taken.has(time) && !tooSoon });
  }
  return out;
}

export function formatDateLong(iso: string): string {
  const { y, m0, d } = parseISO(iso);
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(y, m0, d)));
}

export function formatDateShort(iso: string): string {
  const { y, m0, d } = parseISO(iso);
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(y, m0, d)));
}

export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** Friendly text for the errors raised by the create_booking database function. */
export function bookingErrorMessage(raw: string): string {
  if (raw.includes("slot_taken")) return "Someone just booked that time. Pick another slot.";
  if (raw.includes("slot_unavailable")) return "That time isn't available any more. Pick another slot.";
  if (raw.includes("too_many_requests"))
    return "You already have 3 upcoming call requests. Wait for a reply before booking another.";
  if (raw.includes("invalid_email")) return "Enter a valid email address.";
  if (raw.includes("invalid_name")) return "Enter your name (2–100 characters).";
  if (raw.includes("invalid_input")) return "Check your details and try again.";
  return "Couldn't book the call. Try again in a moment.";
}
