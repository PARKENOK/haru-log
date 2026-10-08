"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { listPostsBetween, type Post } from "@/lib/posts";
import { WEATHERS } from "@/lib/meta";
import PostList from "./PostList";

const noop = () => () => {};

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export default function MonthCalendar() {
  // 빌드 시점과 방문 시점의 날짜가 다르므로 오늘 날짜는 브라우저에서만 계산해요.
  const mounted = useSyncExternalStore(noop, () => true, () => false);
  const [offset, setOffset] = useState(0);
  const [selected, setSelected] = useState<{ offset: number; day: number } | null>(null);
  const [loaded, setLoaded] = useState<{ offset: number; posts: Post[] } | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    const end = new Date(now.getFullYear(), now.getMonth() + offset + 1, 1);
    listPostsBetween(start, end)
      .then((posts) => setLoaded({ offset, posts }))
      .catch((err) => {
        console.error(err);
        setError(true);
      });
  }, [offset]);

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

  const posts = loaded?.offset === offset ? loaded.posts : null;
  const byDay = new Map<number, Post[]>();
  for (const post of posts ?? []) {
    const day = post.recordedAt.getDate();
    byDay.set(day, [...(byDay.get(day) ?? []), post]);
  }
  const selectedDay = selected?.offset === offset ? selected.day : null;
  // 날짜별 목록은 최신 기록이 위로 오게 해요.
  const selectedPosts = selectedDay ? [...(byDay.get(selectedDay) ?? [])].reverse() : [];

  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const move = (delta: number) => setOffset((o) => o + delta);

  return (
    <div className="space-y-6">
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
          {cells.map((day, i) => {
            if (!day) return <div key={i} />;
            const dayPosts = byDay.get(day);
            const first = dayPosts?.[0];
            const isToday = isThisMonth && day === today.getDate();
            const isSelected = day === selectedDay;
            return (
              <button
                key={i}
                disabled={!dayPosts}
                onClick={() => setSelected({ offset, day })}
                aria-label={`${month + 1}월 ${day}일${dayPosts ? `, 기록 ${dayPosts.length}개` : ""}`}
                className={`flex aspect-square flex-col items-center gap-0.5 rounded-lg pt-1.5 transition ${
                  isSelected
                    ? "bg-accent text-white"
                    : dayPosts
                      ? "bg-accent-soft hover:ring-2 hover:ring-accent"
                      : "cursor-default"
                } ${isToday && !isSelected ? "font-bold text-accent" : ""}`}
              >
                {day}
                {first && (
                  <span className="text-base leading-none">
                    {first.mood || (first.weather ? WEATHERS[first.weather].emoji : "•")}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-center text-xs text-ink-soft">
          {error
            ? "기록을 불러오지 못했어요."
            : !posts
              ? "기록을 불러오는 중…"
              : posts.length === 0
                ? "이 달에는 기록이 없어요."
                : `이 달의 기록 ${posts.length}개 · 칠해진 날을 눌러 보세요`}
        </p>
      </div>

      {selectedDay && (
        <div>
          <h2 className="mb-3 font-hand text-3xl">
            {month + 1}월 {selectedDay}일의 기록
          </h2>
          <PostList posts={selectedPosts} />
        </div>
      )}
    </div>
  );
}
