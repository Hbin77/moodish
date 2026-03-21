"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { kakaoLogin } from "@/lib/auth-api";

function KakaoCallbackInner() {
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
    const redirectUri = `${window.location.origin}/auth/kakao/callback`;
    kakaoLogin(code, redirectUri)
      .then((res) => {
        login(res.access_token, res.user);
        const needsProfile = !res.user.age && !res.user.gender;
        router.replace(needsProfile ? "/profile" : "/mood");
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "카카오 로그인에 실패했습니다.");
        setTimeout(() => router.replace("/login"), 2000);
      });
  }, [searchParams, login, router]);

  return error ? (
    <p className="text-sm text-red-500">{error}</p>
  ) : (
    <div className="flex flex-col items-center gap-4">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#BDD5EA] border-t-[#FE5F55]" />
      <p className="text-sm text-[#577399]">카카오 로그인 처리 중...</p>
    </div>
  );
}

export default function KakaoCallbackPage() {
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
          <KakaoCallbackInner />
        </Suspense>
      </div>
    </main>
  );
}
