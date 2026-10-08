export const MOODS = ["😊", "🥰", "😆", "😌", "😐", "😴", "😢", "😡"] as const;

export const WEATHERS = {
  sunny: { emoji: "☀️", label: "맑음" },
  partly: { emoji: "⛅", label: "구름 조금" },
  cloudy: { emoji: "☁️", label: "흐림" },
  rain: { emoji: "🌧️", label: "비" },
  snow: { emoji: "❄️", label: "눈" },
} as const;

export type Weather = keyof typeof WEATHERS;

export const MAX_TAGS = 10;
export const MAX_TAG_LENGTH = 20;

/** "#맛집, 여행 운동" → ["맛집", "여행", "운동"] */
export function parseTags(text: string): string[] {
  const tags = text
    .split(/[,\s]+/)
    .map((t) => t.replace(/^#+/, "").trim().slice(0, MAX_TAG_LENGTH))
    .filter(Boolean);
  return [...new Set(tags)].slice(0, MAX_TAGS);
}
