"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createPost, updatePost, type Post } from "@/lib/posts";
import { toDateTimeLocal } from "@/lib/format";

export default function PostForm({ post }: { post?: Post }) {
  const router = useRouter();
  const [title, setTitle] = useState(post?.title ?? "");
  const [content, setContent] = useState(post?.content ?? "");
  const [recordedAt, setRecordedAt] = useState(() => toDateTimeLocal(post?.recordedAt ?? new Date()));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("제목을 적어 주세요.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const input = { title: title.trim(), content, recordedAt: new Date(recordedAt) };
      const id = post ? (await updatePost(post.id, input), post.id) : await createPost(input);
      router.push(`/posts/${id}`);
    } catch (err) {
      console.error(err);
      setError("저장하지 못했어요. 잠시 후 다시 시도해 주세요.");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-line bg-card p-6 shadow-sm">
      <label className="block">
        <span className="text-sm text-ink-soft">언제의 기록인가요?</span>
        <input
          type="datetime-local"
          value={recordedAt}
          onChange={(e) => setRecordedAt(e.target.value)}
          required
          className="mt-1 block w-full rounded-lg border border-line bg-paper px-3 py-2"
        />
      </label>
      <label className="block">
        <span className="text-sm text-ink-soft">제목</span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={100}
          placeholder="오늘은 어떤 하루였나요?"
          className="mt-1 block w-full rounded-lg border border-line bg-paper px-3 py-2 font-hand text-2xl"
        />
      </label>
      <label className="block">
        <span className="text-sm text-ink-soft">내용</span>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={20000}
          rows={12}
          placeholder="있었던 일, 느낀 점을 자유롭게 적어 보세요."
          className="mt-1 block w-full resize-y rounded-lg border border-line bg-paper px-3 py-2 leading-8"
        />
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-full px-4 py-2 text-ink-soft hover:text-ink"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-accent px-5 py-2 text-white hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "저장 중…" : post ? "수정 완료" : "기록 남기기"}
        </button>
      </div>
    </form>
  );
}
