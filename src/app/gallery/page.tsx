import EmptyState from "@/components/EmptyState";

export const metadata = { title: "갤러리 · 하루기록" };

export default function GalleryPage() {
  return (
    <section>
      <h1 className="font-hand text-4xl">사진 모아보기</h1>
      <p className="mt-1 text-sm text-ink-soft">기록에 담긴 사진들이 이곳에 모여요.</p>
      <div className="mt-6">
        <EmptyState emoji="📷" title="아직 사진이 없어요" />
      </div>
    </section>
  );
}
