import { Suspense } from "react";
import PostDetail from "@/components/PostDetail";

export default function PostPage({ params }: PageProps<"/posts/[id]">) {
  return (
    <Suspense fallback={<p className="text-ink-soft">기록을 불러오는 중…</p>}>
      <PostDetail params={params} />
    </Suspense>
  );
}
