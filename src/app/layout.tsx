import type { Metadata } from "next";
import { Gowun_Dodum, Nanum_Pen_Script } from "next/font/google";
import { Suspense } from "react";
import Link from "next/link";
import AuthProvider from "@/components/AuthProvider";
import Header from "@/components/Header";
import "./globals.css";

const body = Gowun_Dodum({
  variable: "--font-body",
  weight: "400",
  preload: false,
});

const hand = Nanum_Pen_Script({
  variable: "--font-hand",
  weight: "400",
  preload: false,
});

export const metadata: Metadata = {
  title: "하루기록",
  description: "시간, 글, 기분, 날씨를 함께 남기는 나의 일상 블로그",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`${body.variable} ${hand.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <AuthProvider>
          {/* 상세/수정 페이지는 주소가 요청 때 정해져서 헤더를 Suspense로 감싸요. */}
          <Suspense fallback={<div className="h-[61px] border-b border-line bg-card/80" />}>
            <Header />
          </Suspense>
          <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">{children}</main>
          <footer className="py-8 text-center text-sm text-ink-soft">
            © 하루기록 · 오늘도 수고했어요 ·{" "}
            <Link href="/login" className="hover:text-ink">
              주인 로그인
            </Link>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
