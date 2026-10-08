"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createPost, updatePost, type Post } from "@/lib/posts";
import { formatDate, formatTime, toDateTimeLocal } from "@/lib/format";
import { MOODS, parseTags, WEATHERS, type Weather } from "@/lib/meta";
import AiDraft from "./AiDraft";

export default function PostForm({ post }: { post?: Post }) {
  const router = useRouter();
  const [title, setTitle] = useState(post?.title ?? "");
  const [content, setContent] = useState(post?.content ?? "");
  const [recordedAt, setRecordedAt] = useState(() => toDateTimeLocal(post?.recordedAt ?? new Date()));
  const [mood, setMood] = useState(post?.mood ?? "");
  const [weather, setWeather] = useState<Weather | "">(post?.weather ?? "");
  const [place, setPlace] = useState(post?.place ?? "");
  const [tagText, setTagText] = useState(post?.tags.join(", ") ?? "");
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
      const input = {
        title: title.trim(),
        content,
        recordedAt: new Date(recordedAt),
        mood,
        weather,
        place: place.trim(),
        tags: parseTags(tagText),
      };
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
      <div className="grid gap-5 sm:grid-cols-2">
        <fieldset>
          <legend className="text-sm text-ink-soft">기분</legend>
          <div className="mt-1 flex flex-wrap gap-1">
            {MOODS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMood(mood === m ? "" : m)}
                aria-pressed={mood === m}
                className={`rounded-full px-2 py-1 text-xl transition ${
                  mood === m ? "bg-accent-soft ring-2 ring-accent" : "opacity-60 hover:opacity-100"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="text-sm text-ink-soft">날씨</legend>
          <div className="mt-1 flex flex-wrap gap-1">
            {(Object.keys(WEATHERS) as Weather[]).map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => setWeather(weather === w ? "" : w)}
                aria-pressed={weather === w}
                title={WEATHERS[w].label}
                className={`rounded-full px-2 py-1 text-xl transition ${
                  weather === w ? "bg-accent-soft ring-2 ring-accent" : "opacity-60 hover:opacity-100"
                }`}
              >
                {WEATHERS[w].emoji}
              </button>
            ))}
          </div>
        </fieldset>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm text-ink-soft">장소</span>
          <input
            value={place}
            onChange={(e) => setPlace(e.target.value)}
            maxLength={100}
            placeholder="예: 성수동 카페"
            className="mt-1 block w-full rounded-lg border border-line bg-paper px-3 py-2"
          />
        </label>
        <label className="block">
          <span className="text-sm text-ink-soft">태그 (쉼표나 띄어쓰기로 구분)</span>
          <input
            value={tagText}
            onChange={(e) => setTagText(e.target.value)}
            placeholder="예: 맛집, 여행, 운동"
            className="mt-1 block w-full rounded-lg border border-line bg-paper px-3 py-2"
          />
        </label>
      </div>
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
      <AiDraft
        input={{
          memo: content,
          title: title.trim(),
          recordedAt: recordedAt
            ? `${formatDate(new Date(recordedAt))} ${formatTime(new Date(recordedAt))}`
            : "",
          mood,
          weather: weather ? WEATHERS[weather].label : "",
          place: place.trim(),
          tags: parseTags(tagText),
        }}
        onApply={setContent}
      />
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
