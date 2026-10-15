"use client";

import { useState } from "react";
import { auth } from "@/lib/firebase";
import {
  MAX_MEMO_LENGTH,
  SHORT_MEMO_LENGTH,
  splitParagraphs,
  type DraftInput,
} from "@/lib/draft-input";

/** AI에 메모와 함께 보내는 정보. 미리보기 위에 칩으로 보여 주고 빼고 다시 쓸 수 있어요. (G11) */
type InfoKey = "recordedAt" | "title" | "mood" | "weather" | "place" | "tags";

function infoChips(input: DraftInput): { key: InfoKey; label: string }[] {
  const chips: { key: InfoKey; label: string }[] = [];
  if (input.recordedAt) chips.push({ key: "recordedAt", label: `📅 ${input.recordedAt}` });
  if (input.title) chips.push({ key: "title", label: `제목 ${input.title}` });
  if (input.mood) chips.push({ key: "mood", label: `기분 ${input.mood}` });
  if (input.weather) chips.push({ key: "weather", label: `날씨 ${input.weather}` });
  if (input.place) chips.push({ key: "place", label: `📍 ${input.place}` });
  if (input.tags?.length) chips.push({ key: "tags", label: input.tags.map((t) => `#${t}`).join(" ") });
  return chips;
}

/** 짧은 메모일 때 먼저 묻는 질문 (G10) */
const QUESTIONS = ["누구와 함께였나요?", "기억에 남는 장면은?", "그때 어떤 기분이었나요?"];

/** 내용 칸의 메모를 AI가 블로그 글로 완성해 주고, 미리보기 후 적용해요. */
export default function AiDraft({ input, onApply }: {
  input: DraftInput;
  /** 내용 칸을 이 글로 바꿔요. 적용과 되돌리기 모두 이걸 써요. */
  onApply: (content: string) => void;
}) {
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [rewriting, setRewriting] = useState<number | null>(null);
  const [error, setError] = useState("");
  // G10: 짧은 메모에 대한 질문과 답
  const [asking, setAsking] = useState(false);
  const [answers, setAnswers] = useState(["", "", ""]);
  const [length, setLength] = useState<DraftInput["length"]>("normal");
  const [clarified, setClarified] = useState(false);
  // G11: 이번 글에 쓴 정보, 사용자가 뺀 정보
  const [excluded, setExcluded] = useState<InfoKey[]>([]);
  const [used, setUsed] = useState<DraftInput | null>(null);
  // G9: 적용 전 메모와 적용한 글
  const [backup, setBackup] = useState<{ memo: string; applied: string } | null>(null);

  const busy = loading || rewriting !== null;

  /** 질문의 답을 메모 뒤에 붙이고, 사용자가 뺀 정보를 지운 요청을 만들어요. */
  function buildRequest(nextExcluded = excluded, nextLength = length): DraftInput {
    const extra = QUESTIONS.map((q, i) => (answers[i].trim() ? `${q} ${answers[i].trim()}` : ""))
      .filter(Boolean)
      .join("\n");
    const req: DraftInput = {
      ...input,
      memo: extra ? `${input.memo.trim()}\n\n${extra}` : input.memo,
      length: nextLength,
    };
    for (const key of nextExcluded) delete req[key];
    return req;
  }

  async function callApi(req: DraftInput): Promise<string> {
    const token = await auth.currentUser?.getIdToken();
    const res = await fetch("/api/draft", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(req),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error ?? "AI가 글을 쓰지 못했어요.");
    return data.content;
  }

  async function generate(opts: { excluded?: InfoKey[]; length?: DraftInput["length"]; skipAsk?: boolean } = {}) {
    if (!input.memo.trim()) {
      setError("내용 칸에 메모를 먼저 적어 주세요. 예: 친구랑 한강, 치킨, 바람 시원");
      return;
    }
    if (input.memo.length > MAX_MEMO_LENGTH) {
      setError(`메모는 ${MAX_MEMO_LENGTH.toLocaleString()}자까지 쓸 수 있어요.`);
      return;
    }
    // G10: 메모가 짧으면 바로 쓰지 않고 먼저 물어봐요.
    if (!opts.skipAsk && !clarified && input.memo.trim().length < SHORT_MEMO_LENGTH) {
      setError("");
      setAsking(true);
      return;
    }
    const req = buildRequest(opts.excluded, opts.length);
    setLoading(true);
    setError("");
    try {
      setDraft(await callApi(req));
      setUsed(req);
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI가 글을 쓰지 못했어요.");
    } finally {
      setLoading(false);
    }
  }

  function answerAndGenerate(nextLength: DraftInput["length"]) {
    setAsking(false);
    setClarified(true);
    setLength(nextLength);
    generate({ length: nextLength, skipAsk: true });
  }

  /** G11: 칩을 누르면 그 정보를 빼거나 다시 넣고 새로 써요. */
  function toggleInfo(key: InfoKey) {
    const next = excluded.includes(key) ? excluded.filter((k) => k !== key) : [...excluded, key];
    setExcluded(next);
    generate({ excluded: next, skipAsk: true });
  }

  /** G9: 문단 하나만 다시 써요. */
  async function rewriteParagraph(index: number) {
    const paragraphs = splitParagraphs(draft);
    setRewriting(index);
    setError("");
    try {
      const content = await callApi({ ...buildRequest(), rewrite: { paragraphs, index } });
      paragraphs[index] = content.trim();
      setDraft(paragraphs.join("\n\n"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI가 문단을 다시 쓰지 못했어요.");
    } finally {
      setRewriting(null);
    }
  }

  function reset() {
    setDraft("");
    setUsed(null);
    setAsking(false);
    setAnswers(["", "", ""]);
    setClarified(false);
    setLength("normal");
  }

  function apply() {
    setBackup({ memo: input.memo, applied: draft });
    onApply(draft);
    reset();
  }

  function restore() {
    if (!backup) return;
    if (input.memo !== backup.applied && !confirm("적용한 뒤 고친 내용도 사라져요. 메모로 되돌릴까요?")) return;
    onApply(backup.memo);
    setBackup(null);
  }

  const paragraphs = splitParagraphs(draft);
  const allChips = used ? infoChips({ ...input, ...used }) : [];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => generate()}
          disabled={busy}
          className="rounded-full border border-accent px-4 py-1.5 text-sm text-accent hover:bg-accent-soft disabled:opacity-50"
        >
          {loading ? "✨ AI가 쓰는 중… (최대 1분)" : draft ? "✨ 전체 다시 쓰기" : "✨ AI로 글 완성하기"}
        </button>
        {!draft && !busy && !asking && (
          <span className="text-xs text-ink-soft">내용 칸에 짧은 메모를 적고 누르면 블로그 글로 풀어 써 줘요.</span>
        )}
      </div>

      {backup && !draft && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg bg-accent-soft px-3 py-2 text-sm">
          <span className="text-ink-soft">AI 글을 내용 칸에 적용했어요.</span>
          <button type="button" onClick={restore} className="text-accent underline-offset-2 hover:underline">
            ↩ 적용 전 메모로 되돌리기
          </button>
          <button
            type="button"
            onClick={() => setBackup(null)}
            aria-label="되돌리기 안내 닫기"
            className="ml-auto text-ink-soft hover:text-ink"
          >
            ✕
          </button>
        </div>
      )}

      {asking && (
        <div className="space-y-3 rounded-xl border border-dashed border-accent bg-paper p-4">
          <p className="text-sm">
            메모가 짧아서 AI가 내용을 지어낼 수 있어요. 몇 가지만 알려 주면 그대로 살려 쓸게요. (비워 둬도 돼요)
          </p>
          {QUESTIONS.map((q, i) => (
            <label key={q} className="block">
              <span className="text-xs text-ink-soft">{q}</span>
              <input
                value={answers[i]}
                onChange={(e) => setAnswers(answers.map((a, j) => (j === i ? e.target.value : a)))}
                maxLength={200}
                className="mt-1 block w-full rounded-lg border border-line bg-card px-3 py-1.5 text-sm"
              />
            </label>
          ))}
          <div className="flex flex-wrap justify-end gap-2 text-sm">
            <button type="button" onClick={() => setAsking(false)} className="rounded-full px-3 py-1.5 text-ink-soft hover:text-ink">
              취소
            </button>
            <button
              type="button"
              onClick={() => answerAndGenerate("short")}
              className="rounded-full border border-accent px-4 py-1.5 text-accent hover:bg-accent-soft"
            >
              그냥 짧게 쓰기
            </button>
            <button
              type="button"
              onClick={() => answerAndGenerate("normal")}
              className="rounded-full bg-accent px-4 py-1.5 text-white hover:opacity-90"
            >
              답 붙여서 쓰기
            </button>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      {draft && (
        <div className="rounded-xl border border-dashed border-accent bg-paper p-4">
          {allChips.length > 0 && (
            <div className="mb-3">
              <p className="mb-1 text-xs text-ink-soft">이 정보를 바탕으로 썼어요 · 누르면 빼고 다시 써요</p>
              <div className="flex flex-wrap gap-1">
                {allChips.map(({ key, label }) => {
                  const off = excluded.includes(key);
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleInfo(key)}
                      disabled={busy}
                      aria-pressed={!off}
                      title={off ? "다시 넣고 새로 쓰기" : "빼고 새로 쓰기"}
                      className={`rounded-full border px-2 py-0.5 text-xs disabled:opacity-50 ${
                        off ? "border-line text-ink-soft line-through" : "border-accent bg-accent-soft"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          <p className="mb-2 text-xs text-accent">
            AI 미리보기 · 적용하면 내용 칸이 이 글로 바뀌어요 (적용 뒤에도 메모로 되돌릴 수 있어요)
          </p>
          <div className="max-h-96 space-y-3 overflow-y-auto text-sm leading-7">
            {paragraphs.map((p, i) => (
              <div key={i} className="group">
                <p className={`whitespace-pre-line ${rewriting === i ? "opacity-40" : ""}`}>{p}</p>
                <button
                  type="button"
                  onClick={() => rewriteParagraph(i)}
                  disabled={busy}
                  className="text-xs text-ink-soft hover:text-accent disabled:opacity-50"
                >
                  {rewriting === i ? "이 문단 다시 쓰는 중…" : "↻ 이 문단만 다시 쓰기"}
                </button>
              </div>
            ))}
          </div>
          <div className="mt-3 flex justify-end gap-2 text-sm">
            <button type="button" onClick={reset} className="rounded-full px-3 py-1.5 text-ink-soft hover:text-ink">
              닫기
            </button>
            <button
              type="button"
              onClick={apply}
              disabled={busy}
              className="rounded-full bg-accent px-4 py-1.5 text-white hover:opacity-90 disabled:opacity-50"
            >
              적용
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
