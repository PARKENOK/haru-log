import { Suspense } from "react";
import EditPost from "@/components/EditPost";
import OwnerOnly from "@/components/OwnerOnly";

export const metadata = { title: "기록 수정 · 하루기록" };

export default function EditPage({ params }: PageProps<"/posts/[id]/edit">) {
  return (
    <section>
      <h1 className="font-hand text-4xl">기록 수정하기</h1>
      <div className="mt-6">
        <OwnerOnly>
          <Suspense fallback={<p className="text-ink-soft">기록을 불러오는 중…</p>}>
            <EditPost params={params} />
          </Suspense>
        </OwnerOnly>
      </div>
    </section>
  );
}
