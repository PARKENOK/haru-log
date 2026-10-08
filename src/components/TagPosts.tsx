"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { listPostsByTag, type Post } from "@/lib/posts";
import EmptyState from "./EmptyState";
import PostList from "./PostList";

function decodeTag(raw: string) {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export default function TagPosts({ params }: { params: Promise<{ tag: string }> }) {
  const tag = decodeTag(use(params).tag);
  const [result, setResult] = useState<{ tag: string; posts: Post[] } | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    listPostsByTag(tag)
      .then((posts) => setResult({ tag, posts }))
      .catch((err) => {
        console.error(err);
        setError(true);
      });
  }, [tag]);

  const posts = result?.tag === tag ? result.posts : null;

  return (
    <section>
      <h1 className="font-hand text-4xl">#{tag}</h1>
      <p className="mt-1 text-sm text-ink-soft">
        {posts ? `${posts.length}개의 기록` : "같은 태그를 단 기록들이에요."}
      </p>
      <div className="mt-6">
        {error ? (
          <EmptyState emoji="😵" title="기록을 불러오지 못했어요" />
        ) : !posts ? (
          <p className="text-ink-soft">기록을 불러오는 중…</p>
        ) : posts.length === 0 ? (
          <EmptyState emoji="🏷️" title="이 태그를 단 기록이 없어요">
            <Link href="/" className="underline">
              타임라인으로 돌아가기
            </Link>
          </EmptyState>
        ) : (
          <PostList posts={posts} />
        )}
      </div>
    </section>
  );
}
