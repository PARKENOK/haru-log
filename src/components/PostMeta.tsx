import Link from "next/link";
import type { Post } from "@/lib/posts";
import { formatDate, formatTime } from "@/lib/format";
import { WEATHERS } from "@/lib/meta";

/** 날짜·시간, 기분, 날씨, 장소 한 줄 */
export function PostMeta({ post, className = "" }: { post: Post; className?: string }) {
  const weather = post.weather ? WEATHERS[post.weather] : null;
  return (
    <p className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-ink-soft ${className}`}>
      <span>
        {formatDate(post.recordedAt)} · {formatTime(post.recordedAt)}
      </span>
      {(post.mood || weather) && (
        <span title={weather?.label}>
          {post.mood}
          {weather?.emoji}
        </span>
      )}
      {post.place && <span>📍 {post.place}</span>}
    </p>
  );
}

/** 태그 칩 목록. linked면 태그별 모아보기로 이동해요. */
export function TagList({ tags, linked = false }: { tags: string[]; linked?: boolean }) {
  if (tags.length === 0) return null;
  const chip = "rounded-full bg-accent-soft px-2.5 py-0.5 text-xs text-ink";
  return (
    <ul className="flex flex-wrap gap-1.5">
      {tags.map((tag) => (
        <li key={tag}>
          {linked ? (
            <Link href={`/tags/${encodeURIComponent(tag)}`} className={`${chip} hover:bg-accent hover:text-white`}>
              #{tag}
            </Link>
          ) : (
            <span className={chip}>#{tag}</span>
          )}
        </li>
      ))}
    </ul>
  );
}
