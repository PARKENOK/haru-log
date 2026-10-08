import EmptyState from "@/components/EmptyState";

export const metadata = { title: "기록하기 · 하루기록" };

export default function WritePage() {
  return (
    <section>
      <h1 className="font-hand text-4xl">오늘 하루 기록하기</h1>
      <div className="mt-6">
        <EmptyState emoji="🛠️" title="글쓰기 기능을 준비하고 있어요">
          곧 사진, 시간, 기분, 날씨까지 함께 남길 수 있어요.
        </EmptyState>
      </div>
    </section>
  );
}
