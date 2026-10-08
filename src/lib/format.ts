const dateFormat = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "long",
  day: "numeric",
  weekday: "short",
});

const timeFormat = new Intl.DateTimeFormat("ko-KR", {
  hour: "numeric",
  minute: "2-digit",
});

/** 2026년 10월 8일 (목) */
export function formatDate(date: Date) {
  return dateFormat.format(date);
}

/** 오후 2:30 */
export function formatTime(date: Date) {
  return timeFormat.format(date);
}

/** <input type="datetime-local">에 넣을 로컬 시각 문자열 (2026-10-08T14:30) */
export function toDateTimeLocal(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}
