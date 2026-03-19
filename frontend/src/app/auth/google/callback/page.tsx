"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { googleLogin } from "@/lib/auth-api";

function GoogleCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get("code");
    if (!code) {
      router.replace("/login");
      return;
    }
    const redirectUri = `${window.location.origin}/auth/google/callback`;
    googleLogin(code, redirectUri)
      .then((res) => {
        login(res.access_token, res.user);
        router.replace("/mood");
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "구글 로그인에 실패했습니다.");
        setTimeout(() => router.replace("/login"), 2000);
      });
  }, [searchParams, login, router]);

  return error ? (
    <p className="text-sm text-red-500">{error}</p>
  ) : (
    <div className="flex flex-col items-center gap-4">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#BDD5EA] border-t-[#FE5F55]" />
      <p className="text-sm text-[#577399]">구글 로그인 처리 중...</p>
    </div>
  );
}

export default function GoogleCallbackPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F7F7FF]">
      <div className="text-center">
        <Suspense
          fallback={
            <div className="flex flex-col items-center gap-4">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#BDD5EA] border-t-[#FE5F55]" />
              <p className="text-sm text-[#577399]">로딩 중...</p>
            </div>
          }
        >
          <GoogleCallbackInner />
        </Suspense>
      </div>
    </main>
  );
}
