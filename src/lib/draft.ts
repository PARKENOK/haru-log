import type { DraftInput } from "./draft-input";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
// Vercel 환경변수 OPENROUTER_MODEL로 바꿀 수 있어요. (모델 목록: https://openrouter.ai/models)
const DEFAULT_MODEL = "anthropic/claude-sonnet-5.5";

const SYSTEM_PROMPT = `너는 개인 일상 블로그 "하루기록"의 글쓰기 도우미야.
사용자가 남긴 짧은 메모를 바탕으로, 그 사람이 직접 쓴 것 같은 1인칭 일상 블로그 본문을 한국어로 써 줘.

- 메모에 있는 일, 감정, 분위기를 살려 자연스럽게 풀어 써. 메모에 없는 사람, 장소, 사건은 지어내지 마.
- 날짜, 기분, 날씨, 장소 정보가 있으면 어울리게 녹여 써.
- 따뜻하고 편안한 일기 말투로, 3~6개 문단 정도.
- 마크다운 기호(#, *, - 등) 없이 문단과 줄바꿈만 써.
- 본문만 출력해. 제목, 인사말, 설명은 붙이지 마.`;

function buildUserMessage(input: DraftInput) {
  const lines = [
    input.recordedAt && `날짜: ${input.recordedAt}`,
    input.title && `제목: ${input.title}`,
    input.mood && `기분: ${input.mood}`,
    input.weather && `날씨: ${input.weather}`,
    input.place && `장소: ${input.place}`,
    input.tags?.length && `태그: ${input.tags.join(", ")}`,
  ].filter(Boolean);
  return `${lines.join("\n")}\n\n메모:\n${input.memo}`;
}

/** 사용자에게 보여 줄 메시지와 HTTP 상태를 담은 오류 */
export class DraftError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

/** OpenRouter로 메모를 블로그 본문으로 완성해요. */
export async function writeDraft(input: DraftInput): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new DraftError("AI API 키가 설정되어 있지 않아요.", 500);

  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "X-Title": "haru-log",
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL || DEFAULT_MODEL,
      max_tokens: 16000,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserMessage(input) },
      ],
    }),
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    console.error("OpenRouter error", res.status, data?.error);
    if (res.status === 401) throw new DraftError("AI API 키가 올바르지 않아요.", 500);
    if (res.status === 402) throw new DraftError("OpenRouter 크레딧이 부족해요.", 402);
    if (res.status === 429) throw new DraftError("요청이 많아요. 잠시 후 다시 시도해 주세요.", 429);
    throw new DraftError("AI가 글을 쓰지 못했어요. 잠시 후 다시 시도해 주세요.", 502);
  }

  const content: unknown = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) {
    console.error("OpenRouter empty response", data?.choices?.[0]?.finish_reason);
    throw new DraftError("AI가 이 메모로는 글을 쓰지 못했어요. 메모를 바꿔 보세요.", 422);
  }
  return content.trim();
}
