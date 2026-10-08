import MonthCalendar from "@/components/MonthCalendar";

export const metadata = { title: "캘린더 · 하루기록" };

export default function CalendarPage() {
  return (
    <section>
      <h1 className="font-hand text-4xl">달력으로 보기</h1>
      <p className="mt-1 text-sm text-ink-soft">기록이 있는 날에 표시가 생겨요.</p>
      <div className="mt-6">
        <MonthCalendar />
      </div>
    </section>
  );
}
