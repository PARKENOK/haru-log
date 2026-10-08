"use client";

import Link from "next/link";
import { useAuth } from "./AuthProvider";
import EmptyState from "./EmptyState";

/** 블로그 주인에게만 children을 보여 줘요. */
export default function OwnerOnly({ children }: { children: React.ReactNode }) {
  const { loading, user, isOwner } = useAuth();

  if (loading) return <p className="text-ink-soft">확인하는 중…</p>;

  if (!isOwner) {
    return (
      <EmptyState emoji="🔒" title={user ? "글쓰기 권한이 없는 계정이에요" : "로그인이 필요해요"}>
        <Link href="/login" className="underline">
          로그인 페이지로 가기
        </Link>
      </EmptyState>
    );
  }

  return children;
}
