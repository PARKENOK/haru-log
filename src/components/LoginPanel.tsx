"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";

export default function LoginPanel() {
  const router = useRouter();
  const { loading, user, isOwner, signIn, signOut } = useAuth();
  const [error, setError] = useState("");

  async function handleSignIn() {
    setError("");
    try {
      await signIn();
      router.push("/");
    } catch (err) {
      console.error(err);
      setError("로그인하지 못했어요. 팝업이 차단되지 않았는지 확인해 주세요.");
    }
  }

  if (loading) return <p className="text-ink-soft">확인하는 중…</p>;

  return (
    <div className="rounded-2xl border border-line bg-card p-6 text-center shadow-sm">
      {user ? (
        <>
          <p>
            <b>{user.email}</b> 계정으로 로그인했어요.
          </p>
          {!isOwner && <p className="mt-2 text-sm text-ink-soft">이 계정은 글쓰기 권한이 없어요.</p>}
          <button onClick={signOut} className="mt-4 rounded-full border border-line px-4 py-2 hover:bg-accent-soft">
            로그아웃
          </button>
        </>
      ) : (
        <button
          onClick={handleSignIn}
          className="w-full rounded-full bg-accent px-4 py-2.5 text-white hover:opacity-90"
        >
          Google 계정으로 로그인
        </button>
      )}
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  );
}
