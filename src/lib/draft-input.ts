// 브라우저와 서버가 함께 쓰는 AI 글쓰기 요청 형식 (SDK를 브라우저에 싣지 않으려고 분리)
export type DraftInput = {
  memo: string;
  title?: string;
  recordedAt?: string;
  mood?: string;
  weather?: string;
  place?: string;
  tags?: string[];
};

export const MAX_MEMO_LENGTH = 3000;
