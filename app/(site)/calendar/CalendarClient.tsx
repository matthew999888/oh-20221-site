"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type EventDTO = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  startsAt: string;
  endsAt: string | null;
  allDay: boolean;
  category: string | null;
};

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
const WEEKDAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarClient({
  year,
  month,
  events
}: {
  year: number;
  month: number; // 0-indexed
  events: EventDTO[];
}) {
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const eventsByDay = useMemo(() => {
    const map = new Map<number, EventDTO[]>();
    for (const e of events) {
      const d = new Date(e.startsAt);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate();
        if (!map.has(day)) map.set(day, []);
        map.get(day)!.push(e);
      }
    }
    return map;
  }, [events, year, month]);

  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1)
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const prev = month === 0 ? { y: year - 1, m: 12 } : { y: year, m: month };
  const next = month === 11 ? { y: year + 1, m: 1 } : { y: year, m: month + 2 };

  const selectedEvents = selectedDay ? eventsByDay.get(selectedDay) ?? [] : [];

  return (
    <div className="calendar">
      <div className="calendar__toolbar">
        <Link href={`/calendar?y=${prev.y}&m=${prev.m}`} className="btn-ghost" aria-label="Previous month">
          <i className="fa-solid fa-chevron-left" />
        </Link>
        <h2 className="calendar__month-label">
          {MONTH_NAMES[month]} {year}
        </h2>
        <Link href={`/calendar?y=${next.y}&m=${next.m}`} className="btn-ghost" aria-label="Next month">
          <i className="fa-solid fa-chevron-right" />
        </Link>
      </div>

      <div className="calendar__grid calendar__grid--header">
        {WEEKDAY_NAMES.map((w) => (
          <div className="calendar__weekday" key={w}>
            {w}
          </div>
        ))}
      </div>

      <div className="calendar__grid">
        {cells.map((day, i) => {
          if (day === null) return <div className="calendar__cell calendar__cell--empty" key={i} />;
          const dayEvents = eventsByDay.get(day) ?? [];
          const isToday = `${year}-${month}-${day}` === todayKey;
          const isSelected = selectedDay === day;
          return (
            <button
              key={i}
              className={`calendar__cell${isToday ? " is-today" : ""}${isSelected ? " is-selected" : ""}${
                dayEvents.length ? " has-events" : ""
              }`}
              onClick={() => setSelectedDay(dayEvents.length ? day : null)}
              disabled={dayEvents.length === 0}
            >
              <span className="calendar__cell-num">{day}</span>
              {dayEvents.length > 0 && <span className="calendar__cell-dot" aria-hidden="true" />}
            </button>
          );
        })}
      </div>

      {selectedDay && selectedEvents.length > 0 && (
        <div className="calendar__detail">
          <h3>
            {MONTH_NAMES[month]} {selectedDay}, {year}
          </h3>
          <ul className="calendar__detail-list">
            {selectedEvents.map((e) => (
              <li key={e.id}>
                <div className="calendar__detail-time">
                  {e.allDay
                    ? "All day"
                    : new Date(e.startsAt).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                </div>
                <div>
                  <p className="calendar__detail-title">
                    {e.category && <span className="info-card__pin info-card__pin--event">{e.category}</span>} {e.title}
                  </p>
                  {e.location && (
                    <p className="info-card__meta">
                      <i className="fa-solid fa-location-dot" /> {e.location}
                    </p>
                  )}
                  {e.description && <p className="calendar__detail-desc">{e.description}</p>}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
