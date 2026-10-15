import { DraftError, reviewDraft, reviseDraft, validIssues, writeDraft } from "@/lib/draft";
import { MAX_MEMO_LENGTH, MAX_PARAGRAPHS, splitParagraphs, type DraftInput } from "@/lib/draft-input";
import { isOwnerRequest } from "@/lib/verify-owner";

// 글 생성이 수십 초 걸릴 수 있어요.
export const maxDuration = 120;

export async function POST(request: Request) {
  // API 요금이 나가는 기능이라 블로그 주인만 쓸 수 있어요.
  if (!(await isOwnerRequest(request))) {
    return Response.json({ error: "블로그 주인만 쓸 수 있는 기능이에요." }, { status: 401 });
  }

  const input = (await request.json().catch(() => null)) as DraftInput | null;
  const memo = typeof input?.memo === "string" ? input.memo.trim() : "";
  if (!memo) {
    return Response.json({ error: "내용 칸에 메모를 먼저 적어 주세요." }, { status: 400 });
  }
  if (memo.length > MAX_MEMO_LENGTH) {
    return Response.json(
      { error: `메모는 ${MAX_MEMO_LENGTH.toLocaleString()}자까지 쓸 수 있어요.` },
      { status: 400 },
    );
  }

  // 평가자-최적화자: 초안 쓰기(draft) → 검토하기(review) → 고쳐 쓰기(revise). 단계마다 따로 불러 화면에 진행을 보여 줘요.
  const step = input?.step === "review" || input?.step === "revise" ? input.step : "draft";
  const draft = typeof input?.draft === "string" ? input.draft.trim().slice(0, 20000) : "";
  if (step !== "draft" && !draft) {
    return Response.json({ error: "검토할 초안이 없어요." }, { status: 400 });
  }

  try {
    const clean: DraftInput = {
      memo,
      title: String(input?.title ?? "").slice(0, 100),
      recordedAt: String(input?.recordedAt ?? "").slice(0, 40),
      mood: String(input?.mood ?? "").slice(0, 16),
      weather: String(input?.weather ?? "").slice(0, 20),
      place: String(input?.place ?? "").slice(0, 100),
      tags: Array.isArray(input?.tags) ? input.tags.slice(0, 10).map((t) => String(t).slice(0, 20)) : [],
      length: input?.length === "short" ? "short" : "normal",
      rewrite: parseRewrite(input?.rewrite),
      draft,
    };
    if (step === "review") {
      return Response.json({ issues: await reviewDraft(clean) });
    }
    if (step === "revise") {
      const issues = Array.isArray(input?.issues) ? validIssues(input.issues, splitParagraphs(draft).length) : [];
      if (issues.length === 0) return Response.json({ content: draft });
      return Response.json({ content: await reviseDraft({ ...clean, issues }) });
    }
    return Response.json({ content: await writeDraft(clean) });
  } catch (err) {
    if (err instanceof DraftError) {
      return Response.json({ error: err.message }, { status: err.status });
    }
    console.error(err);
    return Response.json({ error: "AI가 글을 쓰지 못했어요. 잠시 후 다시 시도해 주세요." }, { status: 502 });
  }
}

/** 문단 하나만 다시 쓰기 요청을 검사해요. 형식이 맞지 않으면 글 전체를 써요. */
function parseRewrite(value: unknown): DraftInput["rewrite"] {
  if (!value || typeof value !== "object") return undefined;
  const { paragraphs, index } = value as { paragraphs?: unknown; index?: unknown };
  if (!Array.isArray(paragraphs) || paragraphs.length === 0 || paragraphs.length > MAX_PARAGRAPHS) return undefined;
  if (typeof index !== "number" || !Number.isInteger(index) || index < 0 || index >= paragraphs.length) return undefined;
  return { paragraphs: paragraphs.map((p) => String(p).slice(0, MAX_MEMO_LENGTH)), index };
}
