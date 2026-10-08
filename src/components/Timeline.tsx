"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { listPosts, type Post } from "@/lib/posts";
import { formatDate, formatTime } from "@/lib/format";
import EmptyState from "./EmptyState";

export default function Timeline() {
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    listPosts()
      .then(setPosts)
      .catch((err) => {
        console.error(err);
        setError(true);
      });
  }, []);

  if (error) return <EmptyState emoji="😵" title="기록을 불러오지 못했어요" />;
  if (!posts) return <p className="text-ink-soft">기록을 불러오는 중…</p>;
  if (posts.length === 0) {
    return (
      <EmptyState emoji="📔" title="아직 기록이 없어요">
        첫 하루를 남겨 보세요.
      </EmptyState>
    );
  }

  return (
    <ol className="space-y-4">
      {posts.map((post) => (
        <li key={post.id}>
          <Link
            href={`/posts/${post.id}`}
            className="block rounded-2xl border border-line bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <p className="text-xs text-ink-soft">
              {formatDate(post.recordedAt)} · {formatTime(post.recordedAt)}
            </p>
            <h2 className="mt-1 font-hand text-3xl">{post.title}</h2>
            {post.content && (
              <p className="mt-2 line-clamp-3 whitespace-pre-line text-sm leading-7 text-ink/80">
                {post.content}
              </p>
            )}
          </Link>
        </li>
      ))}
    </ol>
  );
}
