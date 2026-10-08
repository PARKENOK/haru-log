"use client";

import { useState } from "react";
import { auth } from "@/lib/firebase";
import { MAX_MEMO_LENGTH, type DraftInput } from "@/lib/draft-input";

/** 내용 칸의 메모를 AI가 블로그 글로 완성해 주고, 미리보기 후 적용해요. */
export default function AiDraft({ input, onApply }: {
  input: DraftInput;
  onApply: (content: string) => void;
}) {
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function generate() {
    if (!input.memo.trim()) {
      setError("내용 칸에 메모를 먼저 적어 주세요. 예: 친구랑 한강, 치킨, 바람 시원");
      return;
    }
    if (input.memo.length > MAX_MEMO_LENGTH) {
      setError(`메모는 ${MAX_MEMO_LENGTH.toLocaleString()}자까지 쓸 수 있어요.`);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(input),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "AI가 글을 쓰지 못했어요.");
      setDraft(data.content);
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI가 글을 쓰지 못했어요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={generate}
          disabled={loading}
          className="rounded-full border border-accent px-4 py-1.5 text-sm text-accent hover:bg-accent-soft disabled:opacity-50"
        >
          {loading ? "✨ AI가 쓰는 중… (최대 1분)" : draft ? "✨ 다시 쓰기" : "✨ AI로 글 완성하기"}
        </button>
        {!draft && !loading && (
          <span className="text-xs text-ink-soft">내용 칸에 짧은 메모를 적고 누르면 블로그 글로 풀어 써 줘요.</span>
        )}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {draft && (
        <div className="rounded-xl border border-dashed border-accent bg-paper p-4">
          <p className="mb-2 text-xs text-accent">AI 미리보기 · 적용하면 내용 칸이 이 글로 바뀌어요</p>
          <div className="max-h-80 overflow-y-auto whitespace-pre-line text-sm leading-7">{draft}</div>
          <div className="mt-3 flex justify-end gap-2 text-sm">
            <button type="button" onClick={() => setDraft("")} className="rounded-full px-3 py-1.5 text-ink-soft hover:text-ink">
              닫기
            </button>
            <button
              type="button"
              onClick={() => {
                onApply(draft);
                setDraft("");
              }}
              className="rounded-full bg-accent px-4 py-1.5 text-white hover:opacity-90"
            >
              적용
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
