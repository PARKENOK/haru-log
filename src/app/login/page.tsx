import LoginPanel from "@/components/LoginPanel";

export const metadata = { title: "로그인 · 하루기록" };

export default function LoginPage() {
  return (
    <section className="mx-auto max-w-sm">
      <h1 className="font-hand text-4xl">로그인</h1>
      <p className="mt-1 text-sm text-ink-soft">블로그 주인만 기록을 남길 수 있어요.</p>
      <div className="mt-6">
        <LoginPanel />
      </div>
    </section>
  );
}
