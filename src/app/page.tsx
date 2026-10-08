import EmptyState from "@/components/EmptyState";

export default function TimelinePage() {
  return (
    <section>
      <h1 className="font-hand text-4xl">오늘의 기록들</h1>
      <p className="mt-1 text-sm text-ink-soft">최근 일상부터 차곡차곡 쌓여요.</p>
      <div className="mt-6">
        <EmptyState emoji="📔" title="아직 기록이 없어요">
          오른쪽 위 ‘기록하기’로 첫 하루를 남겨 보세요.
        </EmptyState>
      </div>
    </section>
  );
}
