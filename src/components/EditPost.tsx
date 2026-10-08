"use client";

import { use, useEffect, useState } from "react";
import { getPost, type Post } from "@/lib/posts";
import EmptyState from "./EmptyState";
import PostForm from "./PostForm";

export default function EditPost({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [post, setPost] = useState<Post | null | undefined>(undefined);

  useEffect(() => {
    getPost(id)
      .then(setPost)
      .catch(() => setPost(null));
  }, [id]);

  if (post === undefined) return <p className="text-ink-soft">기록을 불러오는 중…</p>;
  if (post === null) return <EmptyState emoji="🍂" title="기록을 찾을 수 없어요" />;
  return <PostForm post={post} />;
}
