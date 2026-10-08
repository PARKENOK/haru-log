"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "./AuthProvider";

const NAV = [
  { href: "/", label: "타임라인" },
  { href: "/calendar", label: "캘린더" },
  { href: "/gallery", label: "갤러리" },
];

export default function Header() {
  const pathname = usePathname();
  const { isOwner, signOut } = useAuth();

  return (
    <header className="border-b border-line bg-card/80 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="font-hand text-3xl text-accent">
          하루기록
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          {NAV.map(({ href, label }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`rounded-full px-3 py-1.5 transition-colors ${
                  active ? "bg-accent-soft text-ink" : "text-ink-soft hover:text-ink"
                }`}
              >
                {label}
              </Link>
            );
          })}
          {isOwner && (
            <>
              <Link
                href="/write"
                className="ml-2 rounded-full bg-accent px-3 py-1.5 text-white hover:opacity-90"
              >
                ✏️ 기록하기
              </Link>
              <button onClick={signOut} className="px-2 py-1.5 text-ink-soft hover:text-ink">
                로그아웃
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
