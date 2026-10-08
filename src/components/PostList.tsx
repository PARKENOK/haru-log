import Link from "next/link";
import type { Post } from "@/lib/posts";
import { PostMeta, TagList } from "./PostMeta";

export default function PostList({ posts }: { posts: Post[] }) {
  return (
    <ol className="space-y-4">
      {posts.map((post) => (
        <li key={post.id}>
          <Link
            href={`/posts/${post.id}`}
            className="block rounded-2xl border border-line bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <PostMeta post={post} className="text-xs" />
            <h2 className="mt-1 font-hand text-3xl">{post.title}</h2>
            {post.content && (
              <p className="mt-2 line-clamp-3 whitespace-pre-line text-sm leading-7 text-ink/80">
                {post.content}
              </p>
            )}
            {post.tags.length > 0 && (
              <div className="mt-3">
                <TagList tags={post.tags} />
              </div>
            )}
          </Link>
        </li>
      ))}
    </ol>
  );
}
