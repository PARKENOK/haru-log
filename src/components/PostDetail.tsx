"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { deletePost, getPost, type Post } from "@/lib/posts";
import { formatDate, formatTime } from "@/lib/format";
import { useAuth } from "./AuthProvider";
import EmptyState from "./EmptyState";

export default function PostDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { isOwner } = useAuth();
  const [post, setPost] = useState<Post | null | undefined>(undefined);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    getPost(id)
      .then(setPost)
      .catch((err) => {
        console.error(err);
        setPost(null);
      });
  }, [id]);

  async function handleDelete() {
    if (!confirm("이 기록을 삭제할까요? 되돌릴 수 없어요.")) return;
    setDeleting(true);
    try {
      await deletePost(id);
      router.push("/");
    } catch (err) {
      console.error(err);
      alert("삭제하지 못했어요.");
      setDeleting(false);
    }
  }

  if (post === undefined) return <p className="text-ink-soft">기록을 불러오는 중…</p>;
  if (post === null) {
    return (
      <EmptyState emoji="🍂" title="기록을 찾을 수 없어요">
        <Link href="/" className="underline">
          타임라인으로 돌아가기
        </Link>
      </EmptyState>
    );
  }

  return (
    <article className="rounded-2xl border border-line bg-card p-6 shadow-sm sm:p-8">
      <p className="text-sm text-ink-soft">
        {formatDate(post.recordedAt)} · {formatTime(post.recordedAt)}
      </p>
      <h1 className="mt-1 font-hand text-4xl">{post.title}</h1>
      <div className="mt-6 whitespace-pre-line leading-8">{post.content}</div>

      <div className="mt-8 flex items-center justify-between border-t border-line pt-4 text-sm">
        <Link href="/" className="text-ink-soft hover:text-ink">
          ← 타임라인
        </Link>
        {isOwner && (
          <div className="flex gap-2">
            <Link href={`/posts/${id}/edit`} className="rounded-full px-3 py-1.5 hover:bg-accent-soft">
              수정
            </Link>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-full px-3 py-1.5 text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              {deleting ? "삭제 중…" : "삭제"}
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
