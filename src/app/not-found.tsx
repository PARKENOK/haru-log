import Link from "next/link";
import EmptyState from "@/components/EmptyState";

export default function NotFound() {
  return (
    <EmptyState emoji="🍂" title="페이지를 찾을 수 없어요">
      <Link href="/" className="underline">
        타임라인으로 돌아가기
      </Link>
    </EmptyState>
  );
}
