"use client";

import { useEffect, useState } from "react";
import { listPosts, type Post } from "@/lib/posts";
import EmptyState from "./EmptyState";
import PostList from "./PostList";

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

  return <PostList posts={posts} />;
}
