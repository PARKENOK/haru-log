// 브라우저와 서버가 함께 쓰는 AI 글쓰기 요청 형식 (SDK를 브라우저에 싣지 않으려고 분리)
export type DraftInput = {
  memo: string;
  title?: string;
  recordedAt?: string;
  mood?: string;
  weather?: string;
  place?: string;
  tags?: string[];
  /** "short"면 1~2문단으로 범위를 줄여 써요. (G10) */
  length?: "short" | "normal";
  /** 있으면 글 전체가 아니라 이 문단 하나만 다시 써요. (G9) */
  rewrite?: { paragraphs: string[]; index: number };
};

export const MAX_MEMO_LENGTH = 3000;
/** 이보다 짧은 메모는 바로 쓰지 않고 먼저 되물어요. (G10) */
export const SHORT_MEMO_LENGTH = 30;
export const MAX_PARAGRAPHS = 20;

/** 미리보기 글을 문단 배열로 나눠요. */
export function splitParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}
