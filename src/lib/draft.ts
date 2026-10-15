import { ISSUE_TYPES, MAX_ISSUES, splitParagraphs, type DraftInput, type IssueType, type ReviewIssue } from "./draft-input";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
// Vercel 환경변수 OPENROUTER_MODEL로 바꿀 수 있어요. (모델 목록: https://openrouter.ai/models)
const DEFAULT_MODEL = "anthropic/claude-sonnet-5.5";

function systemPrompt(length: DraftInput["length"]) {
  const amount = length === "short" ? "1~2개 문단 정도로 짧게" : "3~6개 문단 정도";
  return `너는 개인 일상 블로그 "하루기록"의 글쓰기 도우미야.
사용자가 남긴 짧은 메모를 바탕으로, 그 사람이 직접 쓴 것 같은 1인칭 일상 블로그 본문을 한국어로 써 줘.

- 메모에 있는 일, 감정, 분위기를 살려 자연스럽게 풀어 써. 메모에 없는 사람, 장소, 사건은 지어내지 마.
- 날짜, 기분, 날씨, 장소 정보가 있으면 어울리게 녹여 써. 주어지지 않은 정보는 추측해서 넣지 마.
- 따뜻하고 편안한 일기 말투로, ${amount}. 메모가 짧으면 분량을 채우려고 내용을 늘리지 마.
- 문단 사이는 빈 줄 하나로 나눠.
- 마크다운 기호(#, *, - 등) 없이 문단과 줄바꿈만 써.
- 본문만 출력해. 제목, 인사말, 설명은 붙이지 마.`;
}

function buildUserMessage(input: DraftInput) {
  const lines = [
    input.recordedAt && `날짜: ${input.recordedAt}`,
    input.title && `제목: ${input.title}`,
    input.mood && `기분: ${input.mood}`,
    input.weather && `날씨: ${input.weather}`,
    input.place && `장소: ${input.place}`,
    input.tags?.length && `태그: ${input.tags.join(", ")}`,
  ].filter(Boolean);
  const base = `${lines.join("\n")}\n\n메모:\n${input.memo}`;
  if (!input.rewrite) return base;

  // 문단 하나만 다시 쓰기 (G9)
  const { paragraphs, index } = input.rewrite;
  const numbered = paragraphs.map((p, i) => `[${i + 1}] ${p}`).join("\n\n");
  return `${base}

지금 쓴 글:
${numbered}

위 글의 [${index + 1}]번 문단만 새로 써 줘. 앞뒤 문단과 자연스럽게 이어지고, 다른 문단의 내용을 되풀이하지 마.
번호 없이 새 문단 하나만 출력해.`;
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

/** OpenRouter에 메시지를 보내고 답 텍스트를 돌려받아요. */
async function callModel(system: string, user: string): Promise<string> {
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
        { role: "system", content: system },
        { role: "user", content: user },
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

/** 1단계: 메모를 블로그 본문으로 완성해요. (문단 하나만 다시 쓰기도 여기서) */
export function writeDraft(input: DraftInput): Promise<string> {
  return callModel(systemPrompt(input.length), buildUserMessage(input));
}

const REVIEW_PROMPT = `너는 개인 일상 블로그 "하루기록"의 글 검토자야.
사용자의 메모와 정보, 그리고 AI가 그 메모로 쓴 초안을 받아. 초안에서 아래 두 가지 문제만 찾아.

- invented: 메모나 주어진 정보(날짜, 기분, 날씨, 장소, 태그)에 없는 사람, 장소, 사건, 구체적 사실을 지어낸 부분.
  메모 내용을 감정이나 분위기로 자연스럽게 풀어 쓴 것은 문제가 아니야.
- dull: 독자 입장에서 지루한 문단. 앞에서 한 말을 되풀이하거나, 누구 일기에나 들어갈 뻔한 말만 있는 문단.

정말 고쳐야 할 것만, 중요한 순서로 최대 ${MAX_ISSUES}개까지 골라. 문제가 없으면 빈 목록을 돌려줘.
설명 없이 아래 JSON만 출력해.
{"issues":[{"paragraph":문단 번호,"type":"invented" 또는 "dull","quote":"초안에서 그대로 옮긴 짧은 부분","reason":"왜 문제인지 한 문장"}]}`;

/** 2단계: 초안에서 지어낸 내용과 지루한 문단을 찾아요. */
export async function reviewDraft(input: DraftInput): Promise<ReviewIssue[]> {
  const paragraphs = splitParagraphs(input.draft ?? "");
  const numbered = paragraphs.map((p, i) => `[${i + 1}] ${p}`).join("\n\n");
  const text = await callModel(REVIEW_PROMPT, `${buildUserMessage({ ...input, rewrite: undefined })}\n\n초안:\n${numbered}`);
  // 코드로 점검하는 관문: JSON 형식과 값이 맞는 의견만 통과시켜요.
  const issues = parseIssues(text.replace(/^```(?:json)?\s*|\s*```$/g, ""), paragraphs.length);
  if (!issues) throw new DraftError("AI가 검토 결과를 제대로 주지 못했어요.", 502);
  return issues;
}

const REVISE_PROMPT = `너는 개인 일상 블로그 "하루기록"의 글쓰기 도우미야.
AI가 쓴 초안과 검토 의견을 받아. 검토 의견이 지적한 부분만 고쳐서 글 전체를 다시 출력해.

- invented 의견: 지어낸 부분을 빼거나, 메모에 있는 내용으로 바꿔.
- dull 의견: 되풀이를 줄이고, 메모에 있는 구체적인 장면이나 감정으로 바꿔. 새로운 사실을 지어내지 마.
- 지적받지 않은 문단은 그대로 둬.
- 문단 사이는 빈 줄 하나로 나누고, 마크다운 기호 없이 본문만 출력해.`;

/** 3단계: 검토 의견을 반영해 고쳐 써요. */
export function reviseDraft(input: DraftInput): Promise<string> {
  const notes = (input.issues ?? [])
    .map((it) => `- [${it.paragraph}]번 문단, ${it.type}: "${it.quote}" — ${it.reason}`)
    .join("\n");
  return callModel(
    REVISE_PROMPT,
    `${buildUserMessage({ ...input, rewrite: undefined })}\n\n초안:\n${input.draft}\n\n검토 의견:\n${notes}`,
  );
}

/** 검토 JSON을 읽어요. 형식이 틀리면 null이에요. */
function parseIssues(text: string, paragraphCount: number): ReviewIssue[] | null {
  try {
    const list = (JSON.parse(text) as { issues?: unknown })?.issues;
    return Array.isArray(list) ? validIssues(list, paragraphCount) : null;
  } catch {
    return null;
  }
}

/** 값이 맞는 검토 의견만 남겨요. 브라우저가 돌려보낸 의견도 이걸로 다시 걸러요. */
export function validIssues(list: unknown[], paragraphCount: number): ReviewIssue[] {
  return list
    .filter((it): it is Record<string, unknown> => !!it && typeof it === "object")
    .filter((it) => typeof it.type === "string" && it.type in ISSUE_TYPES)
    .filter((it) => Number.isInteger(it.paragraph) && (it.paragraph as number) >= 1 && (it.paragraph as number) <= paragraphCount)
    .slice(0, MAX_ISSUES)
    .map((it) => ({
      paragraph: it.paragraph as number,
      type: it.type as IssueType,
      quote: String(it.quote ?? "").slice(0, 300),
      reason: String(it.reason ?? "").slice(0, 300),
    }));
}
