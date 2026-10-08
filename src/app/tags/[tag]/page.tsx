import { Suspense } from "react";
import TagPosts from "@/components/TagPosts";

export default function TagPage({ params }: PageProps<"/tags/[tag]">) {
  return (
    <Suspense fallback={<p className="text-ink-soft">기록을 불러오는 중…</p>}>
      <TagPosts params={params} />
    </Suspense>
  );
}
