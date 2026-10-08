"use client";

import { useState, useSyncExternalStore } from "react";

const noop = () => () => {};

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export default function MonthCalendar() {
  // 빌드 시점과 방문 시점의 날짜가 다르므로 오늘 날짜는 브라우저에서만 계산해요.
  const mounted = useSyncExternalStore(noop, () => true, () => false);
  const [offset, setOffset] = useState(0);

  if (!mounted) {
    return <div className="h-96 rounded-2xl border border-line bg-card" />;
  }

  const today = new Date();
  const cursor = new Date(today.getFullYear(), today.getMonth() + offset, 1);
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const isThisMonth = today.getFullYear() === year && today.getMonth() === month;

  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const move = (delta: number) => setOffset((o) => o + delta);

  return (
    <div className="rounded-2xl border border-line bg-card p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <button onClick={() => move(-1)} className="rounded-full px-3 py-1 hover:bg-accent-soft" aria-label="이전 달">
          ‹
        </button>
        <span className="font-hand text-3xl">
          {year}년 {month + 1}월
        </span>
        <button onClick={() => move(1)} className="rounded-full px-3 py-1 hover:bg-accent-soft" aria-label="다음 달">
          ›
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-sm">
        {WEEKDAYS.map((d, i) => (
          <div key={d} className={`py-1 text-xs ${i === 0 ? "text-accent" : "text-ink-soft"}`}>
            {d}
          </div>
        ))}
        {cells.map((day, i) => (
          <div
            key={i}
            className={`aspect-square rounded-lg pt-1.5 ${
              day && isThisMonth && day === today.getDate()
                ? "bg-accent text-white"
                : day
                  ? "hover:bg-accent-soft"
                  : ""
            }`}
          >
            {day}
          </div>
        ))}
      </div>
    </div>
  );
}
