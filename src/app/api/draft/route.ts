import { DraftError, writeDraft } from "@/lib/draft";
import { MAX_MEMO_LENGTH, type DraftInput } from "@/lib/draft-input";
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

  try {
    const content = await writeDraft({
      memo,
      title: String(input?.title ?? "").slice(0, 100),
      recordedAt: String(input?.recordedAt ?? "").slice(0, 40),
      mood: String(input?.mood ?? "").slice(0, 16),
      weather: String(input?.weather ?? "").slice(0, 20),
      place: String(input?.place ?? "").slice(0, 100),
      tags: Array.isArray(input?.tags) ? input.tags.slice(0, 10).map((t) => String(t).slice(0, 20)) : [],
    });
    return Response.json({ content });
  } catch (err) {
    if (err instanceof DraftError) {
      return Response.json({ error: err.message }, { status: err.status });
    }
    console.error(err);
    return Response.json({ error: "AI가 글을 쓰지 못했어요. 잠시 후 다시 시도해 주세요." }, { status: 502 });
  }
}
