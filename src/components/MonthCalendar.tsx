import { useState, type ReactNode } from "react";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import { MONTH_NAMES, dowOf, isoOf } from "@/lib/booking";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type Props = {
  /** Month shown first, as YYYY-MM-DD (any day in that month). */
  initial: string;
  /** Earliest / latest month the arrows can reach (YYYY-MM-DD, any day in the month). */
  minMonth?: string;
  maxMonth?: string;
  /** Renders one day cell. Receives the ISO date and the day number. */
  renderDay: (iso: string, day: number) => ReactNode;
  className?: string;
};

const monthKey = (y: number, m0: number) => y * 12 + m0;
const keyOfISO = (iso: string) => {
  const [y = 1970, m = 1] = iso.split("-").map(Number);
  return monthKey(y, m - 1);
};

/** A month grid (Monday first) shared by the booking section and the admin calendar. */
export default function MonthCalendar({ initial, minMonth, maxMonth, renderDay, className = "" }: Props) {
  const [cursor, setCursor] = useState(() => {
    const [y = 1970, m = 1] = initial.split("-").map(Number);
    return { y, m0: m - 1 };
  });

  const key = monthKey(cursor.y, cursor.m0);
  const canPrev = minMonth === undefined || key > keyOfISO(minMonth);
  const canNext = maxMonth === undefined || key < keyOfISO(maxMonth);

  const step = (delta: number) =>
    setCursor((c) => {
      const t = c.m0 + delta;
      return { y: c.y + Math.floor(t / 12), m0: ((t % 12) + 12) % 12 };
    });

  const daysInMonth = new Date(Date.UTC(cursor.y, cursor.m0 + 1, 0)).getUTCDate();
  const firstDow = dowOf(isoOf(cursor.y, cursor.m0, 1)); // 0 = Sunday
  const lead = (firstDow + 6) % 7; // Monday-first offset

  const cells: (number | null)[] = [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className={className}>
      <div className="mb-5 flex items-center justify-between">
        <p className="text-lg font-light tracking-tight">
          {MONTH_NAMES[cursor.m0]} <span className="text-muted-foreground">{cursor.y}</span>
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => step(-1)}
            disabled={!canPrev}
            aria-label="Previous month"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-all duration-300 hover:border-primary/40 hover:text-primary disabled:pointer-events-none disabled:opacity-30"
          >
            <CaretLeft size={16} weight="light" />
          </button>
          <button
            type="button"
            onClick={() => step(1)}
            disabled={!canNext}
            aria-label="Next month"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-all duration-300 hover:border-primary/40 hover:text-primary disabled:pointer-events-none disabled:opacity-30"
          >
            <CaretRight size={16} weight="light" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5 text-center sm:gap-2">
        {WEEKDAYS.map((w) => (
          <span key={w} className="pb-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            {w}
          </span>
        ))}
        {cells.map((day, i) =>
          day === null ? (
            <span key={`pad-${i}`} aria-hidden />
          ) : (
            <div key={day}>{renderDay(isoOf(cursor.y, cursor.m0, day), day)}</div>
          ),
        )}
      </div>
    </div>
  );
}
