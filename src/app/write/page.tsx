import OwnerOnly from "@/components/OwnerOnly";
import PostForm from "@/components/PostForm";

export const metadata = { title: "기록하기 · 하루기록" };

export default function WritePage() {
  return (
    <section>
      <h1 className="font-hand text-4xl">오늘 하루 기록하기</h1>
      <div className="mt-6">
        <OwnerOnly>
          <PostForm />
        </OwnerOnly>
      </div>
    </section>
  );
}
